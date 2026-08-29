import fs from "fs";
import path from "path";
import crypto from "crypto";
import http from "http";
import https from "https";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Resolves target client key from marker or env
const resolveClientKey = () => {
  const envClient = process.env.CLIENT || process.env.CLIENT_NAME || process.env.CLIENT_KEY;
  if (envClient) return envClient.toLowerCase().trim();

  const clientMarker = path.join(projectRoot, ".client");
  if (fs.existsSync(clientMarker)) {
    const val = fs.readFileSync(clientMarker, "utf8").trim().toLowerCase();
    if (val) return val;
  }

  return "decantre";
};

const CLIENT_KEY = resolveClientKey();
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "fa0942a4bd8e442e22f78fdb6a2a605a";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "5f0500c118548702bac32a3d027bc355";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "9d1693a66753deb308fff14315b34abcae11e16d12b5796457d92abb73259514";
const R2_BUCKET = process.env.R2_BUCKET_NAME || "clienthub-backups";
const R2_HOST = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Calculates AWS Signature Version 4 HMAC key
const getSignatureKey = (key, dateStamp, regionName, serviceName) => {
  const kDate = crypto.createHmac("sha256", "AWS4" + key).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(regionName).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(serviceName).digest();
  return crypto.createHmac("sha256", kService).update("aws4_request").digest();
};

// Uploads buffer or stream directly to Cloudflare R2 via S3 SigV4 PUT
const uploadToR2 = (objectKey, fileBuffer) => {
  return new Promise((resolve, reject) => {
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const region = "auto";
    const service = "s3";

    const payloadHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const canonicalUri = `/${R2_BUCKET}/${objectKey}`;

    const canonicalHeaders = `host:${R2_HOST}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/${region}/${service}/aws4_request\n${crypto.createHash("sha256").update(canonicalRequest).digest("hex")}`;

    const signingKey = getSignatureKey(R2_SECRET_ACCESS_KEY, dateStamp, region, service);
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${dateStamp}/${region}/${service}/aws4_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const req = https.request(
      {
        host: R2_HOST,
        port: 443,
        path: canonicalUri,
        method: "PUT",
        headers: {
          Host: R2_HOST,
          "x-amz-date": amzDate,
          "x-amz-content-sha256": payloadHash,
          Authorization: authorizationHeader,
          "Content-Length": fileBuffer.length,
          "Content-Type": "application/gzip",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, objectKey });
          } else {
            reject(new Error(`R2 upload failed (${res.statusCode}): ${body}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(fileBuffer);
    req.end();
  });
};

// Executes database dump and streams archive to Cloudflare R2
const runBackupPipeline = async () => {
  console.log(`🚀 [R2 Backup] Starting automated backup for client: [${CLIENT_KEY}]`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(projectRoot, "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = `${CLIENT_KEY}_db_${timestamp}.sql.gz`;
  const localFilePath = path.join(backupDir, filename);

  if (process.argv.includes("--dry-run")) {
    console.log("🧪 [Dry-Run] Testing S3 SigV4 authentication against Cloudflare R2...");
    const testBuffer = Buffer.from(`Plexivia R2 Backup Diagnostic Probe - ${new Date().toISOString()}`);
    await uploadToR2(`diagnostics/${CLIENT_KEY}_test.txt`, testBuffer);
    console.log("✅ [Dry-Run] Cloudflare R2 connection & upload verified successfully!");
    return;
  }

  // Find running Mongo container
  let containerName = `${CLIENT_KEY}-mongodb-live`;
  try {
    const out = await new Promise((resolve) => {
      exec("docker ps --format '{{.Names}}'", (err, stdout) => resolve(stdout || ""));
    });
    if (!out.includes(containerName)) {
      const match = out.split("\n").find((n) => n.includes("mongo") || n.includes("mongodb"));
      if (match) containerName = match.trim();
    }
  } catch {}

  console.log(`📦 [R2 Backup] Dumping MongoDB from container: [${containerName}]...`);

  const dumpCmd = `docker exec ${containerName} mongodump --archive --gzip`;
  const dumpBuffer = await new Promise((resolve, reject) => {
    exec(dumpCmd, { maxBuffer: 500 * 1024 * 1024, encoding: "buffer" }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr.toString() || err.message));
      }
      resolve(stdout);
    });
  });

  fs.writeFileSync(localFilePath, dumpBuffer);
  const sizeMb = (dumpBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`✅ [R2 Backup] Local dump archive created: ${filename} (${sizeMb} MB)`);

  const r2Key = `backups/${CLIENT_KEY}/${filename}`;
  console.log(`☁️ [R2 Backup] Uploading to Cloudflare R2: [${R2_BUCKET}/${r2Key}]...`);
  await uploadToR2(r2Key, dumpBuffer);
  console.log(`🎉 [R2 Backup] Database backup uploaded to Cloudflare R2 successfully!`);

  // Clean local archives older than 7 days
  try {
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    for (const f of files) {
      const fp = path.join(backupDir, f);
      const stat = fs.statSync(fp);
      if (now - stat.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
        fs.unlinkSync(fp);
      }
    }
  } catch {}
};

runBackupPipeline().catch((err) => {
  console.error("❌ [R2 Backup Error]:", err.message);
  process.exit(1);
});
