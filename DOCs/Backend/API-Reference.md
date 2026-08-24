# 🚀 Backend REST API Reference

The backend operates on port `5000` using Express.js and the official Cloudflare D1 REST query driver.

---

## 📡 Endpoints

### 1. Projects
- `GET /api/projects` - List all registered projects.
- `POST /api/projects` - Register a new project.
- `GET /api/projects/:slug` - Get project details.

### 2. Documentation
- `GET /api/projects/:slug/docs` - List docs for a project.
- `GET /api/projects/:slug/docs/:docSlug` - Get single document.
- `POST /api/projects/:slug/docs` - Create new document.
- `PUT /api/projects/:slug/docs/:docSlug` - Update document content.
- `DELETE /api/projects/:slug/docs/:docSlug` - Delete document.

### 3. AI Action Logs
- `GET /api/projects/:slug/logs?scope=frontend&featureKey=FEAT-1` - Query filtered logs.
- `POST /api/projects/:slug/logs` - Ingest log with `summary`, `scope`, `commitId`, and `changedFiles`.

```bash
# Ingest test log via cURL
curl -X POST http://localhost:5000/api/projects/docsnlogs/logs \
  -H "Content-Type: application/json" \
  -d '{"summary": "Created REST API Docs", "scope": "backend", "commitId": "87f0924"}'
```
