import dotenv from "dotenv";
import { queryD1 } from "../server/config/d1";
import { randomUUID } from "crypto";
import { execSync } from "child_process";

dotenv.config();

const getGitCommit = () => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch (e) {
    return "";
  }
};

export async function pushDirectLog({
  projectSlug = "docsnlogs",
  scope = "backend",
  featureKey = "FEAT-1",
  subTaskKey = "TASK-1-2",
  action = "feature",
  summary,
  promptUsed = "",
  changedFiles = [] as string[],
  diffSummary = "",
  commitId = "",
}: {
  projectSlug?: string;
  scope?: string;
  featureKey?: string;
  subTaskKey?: string;
  action?: string;
  summary: string;
  promptUsed?: string;
  changedFiles?: string[];
  diffSummary?: string;
  commitId?: string;
}) {
  const commit = commitId || getGitCommit();
  const logId = randomUUID();

  // Auto-create Feature if key provided but not exists
  if (featureKey) {
    const featExists = await queryD1(`SELECT * FROM features WHERE project_slug = ? AND key = ?`, [projectSlug, featureKey]);
    if (featExists.length === 0) {
      await queryD1(
        `INSERT INTO features (id, project_slug, key, scope, title, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), projectSlug, featureKey, scope, `Feature ${featureKey}`, "Auto-created by AI Log Engine", "in_progress"]
      );
    }
  }

  // Auto-create SubTask if key provided but not exists
  if (subTaskKey && featureKey) {
    const taskExists = await queryD1(`SELECT * FROM subtasks WHERE project_slug = ? AND key = ?`, [projectSlug, subTaskKey]);
    if (taskExists.length === 0) {
      await queryD1(
        `INSERT INTO subtasks (id, project_slug, key, feature_key, title, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), projectSlug, subTaskKey, featureKey, `Task ${subTaskKey}`, "in_progress", "Auto-created by AI Log Engine"]
      );
    }
  }

  await queryD1(
    `INSERT INTO logs (id, project_slug, scope, feature_key, sub_task_key, action, summary, prompt_used, changed_files, diff_summary, commit_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      logId,
      projectSlug,
      scope,
      featureKey,
      subTaskKey,
      action,
      summary,
      promptUsed,
      JSON.stringify(changedFiles),
      diffSummary,
      commit,
    ]
  );

  console.log(`✅ [D1 Direct Logger] Stored log ${logId} | Commit: ${commit} | Scope: ${scope}`);
  return { id: logId, commit, summary };
}

// CLI invoker if run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const summaryArg = args.find((a, i) => args[i - 1] === "--summary") || args[0] || "Update";
  const scopeArg = args.find((a, i) => args[i - 1] === "--scope") || "backend";
  const featArg = args.find((a, i) => args[i - 1] === "--feat") || "FEAT-1";
  const taskArg = args.find((a, i) => args[i - 1] === "--task") || "TASK-1-2";
  const filesArg = (args.find((a, i) => args[i - 1] === "--files") || "").split(",").filter(Boolean);

  pushDirectLog({
    summary: summaryArg,
    scope: scopeArg,
    featureKey: featArg,
    subTaskKey: taskArg,
    changedFiles: filesArg,
  }).catch(console.error);
}
