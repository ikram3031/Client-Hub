# ⚡ Cloudflare D1 Database Architecture

## 🗄️ Database Tables Overview
docsNlogs uses 5 core SQLite tables hosted on Cloudflare D1:

1. **`projects`**: Registry of all client and internal workspaces.
2. **`docs`**: Markdown documentation pages partitioned by `project_slug` and `category`.
3. **`features`**: High-level JIRA-style Epics and milestones (`FEAT-1`, `FEAT-2`).
4. **`subtasks`**: Granular tasks tied to features (`TASK-1-1`, `TASK-1-2`).
5. **`logs`**: AI action logs containing modified files, diff summaries, user prompts, and `commit_id`.

---

## 📊 SQL Schema

```sql
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  scope TEXT NOT NULL,
  feature_key TEXT,
  sub_task_key TEXT,
  action TEXT DEFAULT 'feature',
  summary TEXT NOT NULL,
  prompt_used TEXT DEFAULT '',
  changed_files TEXT DEFAULT '[]',
  diff_summary TEXT DEFAULT '',
  commit_id TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
