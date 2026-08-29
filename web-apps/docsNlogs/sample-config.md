# ⚙️ docsNlogs Client Configuration Sample

This file details the schema and fields stored in `.config/config.json` for any project using the **docsNlogs Hub**.

---

## 📄 File Location
Path: `.config/config.json` (inside the client project root)

---

## 🧩 Configuration Schema & Fields

```json
{
  "hubApiUrl": "http://localhost:5000",
  "project": {
    "name": "My Client App",
    "slug": "my-client-app",
    "description": "White-label e-commerce or ERP system"
  },
  "docs": {
    "categories": [
      "Architecture",
      "Backend",
      "Frontend",
      "Dashboard",
      "Deployment"
    ]
  },
  "logs": {
    "scopes": [
      "frontend",
      "backend",
      "dashboard"
    ],
    "autoCommit": true
  }
}
```

---

## 🔍 Field Definitions

| Field Path | Type | Required | Description |
|---|---|---|---|
| `hubApiUrl` | `string` | **Yes** | The base URL of the running docsNlogs Hub server (e.g. `http://localhost:5000` or `https://vps.yourdomain.com`). |
| `project.name` | `string` | **Yes** | Display name of the project (e.g. `Client ERP System`). |
| `project.slug` | `string` | **Yes** | Unique identifier used for API routing and Cloudflare D1 isolation. |
| `project.description`| `string` | No | Short summary or role of the project. |
| `docs.categories` | `string[]` | **Yes** | Documentation sections to initialize (e.g. `Architecture`, `Backend`, `Frontend`). |
| `logs.scopes` | `string[]` | **Yes** | Allowed scopes for logging (e.g. `frontend`, `backend`, `dashboard`). |
| `logs.autoCommit` | `boolean` | No | Whether client helper triggers automatic log commits. |

---

## 🚀 How to Generate
Run the interactive CLI initializer from terminal:
```bash
node scripts/init-config.js
```
This wizard will prompt for project details, initialize `.config/config.json`, and automatically onboard the project to the Cloudflare D1 Hub.
