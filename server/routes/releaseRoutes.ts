import { Router } from "express";
import { queryD1 } from "../config/d1";

export const releaseRouter = Router();

// 1. List all releases (optionally filtered by projectId)
releaseRouter.get("/", async (req, res) => {
  try {
    const { projectId } = req.query;

    let sql = `
      SELECT r.*, p.name as project_name, p.slug as project_slug
      FROM releases r
      LEFT JOIN projects p ON r.project_id = p.id OR r.project_id = p.slug
    `;
    const params: any[] = [];

    if (projectId) {
      sql += ` WHERE r.project_id = ?`;
      params.push(projectId);
    }

    sql += ` ORDER BY r.created_at DESC`;

    const releases = await queryD1(sql, params);
    res.json({ success: true, data: releases });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Single Release with Client Deployment Rollout Status
releaseRouter.get("/:releaseId", async (req, res) => {
  try {
    const { releaseId } = req.params;

    const releases = await queryD1(`SELECT * FROM releases WHERE release_id = ?`, [releaseId]);
    if (releases.length === 0) {
      return res.status(404).json({ success: false, error: "Release not found" });
    }

    const release = releases[0];

    // Query clients that have deployed or are pending this release
    const clients = await queryD1(
      `SELECT client_key, brand_name, domain, app_version, git_commit_hash, status, last_deployed_at
       FROM clients
       WHERE project_id = ? OR project_id = 'prj_wlecom'`,
      [release.project_id]
    );

    const clientStatusMatrix = clients.map((c) => ({
      clientKey: c.client_key,
      brandName: c.brand_name,
      domain: c.domain,
      currentVersion: c.app_version,
      isUpToDate: c.app_version === release.version_tag.replace(/^v/, ""),
      status: c.status,
      lastDeployedAt: c.last_deployed_at,
    }));

    res.json({
      success: true,
      data: {
        ...release,
        clientsMatrix: clientStatusMatrix,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Publish a New Version Release with Changelog & Git SHA
releaseRouter.post("/", async (req, res) => {
  try {
    const {
      projectId = "prj_wlecom",
      versionTag,
      gitCommitSha,
      title,
      releaseType = "minor",
      changelogMd,
      breakingChanges = "",
      targetEnv = "production",
      createdBy = "super_admin",
    } = req.body;

    if (!versionTag || !gitCommitSha || !title || !changelogMd) {
      return res.status(422).json({
        success: false,
        error: "versionTag, gitCommitSha, title, and changelogMd are required",
      });
    }

    const cleanVer = versionTag.startsWith("v") ? versionTag : `v${versionTag}`;
    const releaseId = `rel_${projectId}_${cleanVer.replace(/\./g, "")}`;

    await queryD1(
      `INSERT OR REPLACE INTO releases (
        release_id, project_id, version_tag, git_commit_sha, title,
        release_type, changelog_md, breaking_changes, target_env, is_published, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        releaseId,
        projectId,
        cleanVer,
        gitCommitSha,
        title,
        releaseType,
        changelogMd,
        breakingChanges,
        targetEnv,
        createdBy,
      ]
    );

    // Update current_version on project
    await queryD1(
      `UPDATE projects
       SET current_version = ?, latest_release_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? OR slug = ?`,
      [cleanVer.replace(/^v/, ""), releaseId, projectId, projectId]
    );

    res.json({
      success: true,
      message: `Release [${cleanVer}] published successfully for project [${projectId}]`,
      releaseId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Batch Rollout Release to All Clients of Project
releaseRouter.post("/:releaseId/rollout", async (req, res) => {
  try {
    const { releaseId } = req.params;

    const releases = await queryD1(`SELECT * FROM releases WHERE release_id = ?`, [releaseId]);
    if (releases.length === 0) {
      return res.status(404).json({ success: false, error: "Release not found" });
    }

    const release = releases[0];
    const clients = await queryD1(`SELECT client_key FROM clients WHERE project_id = ? OR project_id = 'prj_wlecom'`, [
      release.project_id,
    ]);

    const queuedTaskIds: string[] = [];

    for (const c of clients) {
      const taskId = `task_rollout_${release.version_tag}_${c.client_key}_${Date.now()}`;
      await queryD1(
        `INSERT INTO remote_tasks (task_id, client_key, action_type, payload_json, status, requested_by)
         VALUES (?, ?, 'DEPLOY_LATEST', ?, 'pending', 'release_rollout')`,
        [taskId, c.client_key, JSON.stringify({ version: release.version_tag, commit: release.git_commit_sha })]
      );
      queuedTaskIds.push(taskId);
    }

    res.json({
      success: true,
      message: `Rollout queued for ${clients.length} clients to version [${release.version_tag}]`,
      queuedTaskIds,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
