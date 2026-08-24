# 🤖 Gemini Agent Rules & Guidelines

1. **Short Comments on Functions**: Always put a relatively short, descriptive comment on top of every function explaining its purpose.
2. **Arrow Functions**: Always use arrow functions (`const myFunction = () => { ... }`) across all TypeScript and JavaScript files.
3. **Central Multi-Project Architecture**: This is the central docsNlogs project. The frontend must display all projects added/registered in the Cloudflare D1 hub.
4. **Docs & Logs Governance**: 
   - Manage docs in `DOCs/` directory and sync with Cloudflare D1 database.
   - For every implemented chunk, commit to Git, extract the git commit ID, and push an AI action log to Cloudflare D1 using `scripts/log.js` or `direct-log.ts`.
5. **Direct Copy Output**: Ensure all code snippets and CLI commands in markdown and viewers have 1-click direct copy functionality.
