# 📦 docsNlogs AI Client Kit

A zero-dependency, drop-in utility that connects any Git repository to the centralized **docsNlogs Hub**.

---

## ⚡ Quick 60-Second Setup in Any Project

### Step 1: Copy `client-kit/` to your target project
Copy the entire `client-kit/` folder into your project root.

### Step 2: Add to `.gitignore`
Add the following line to your target project's `.gitignore` file so it doesn't pollute the client repo:

```gitignore
/client-kit/
/.config/
```

### Step 3: Initialize Configuration
Run the interactive onboarding wizard:

```bash
node client-kit/init.js
```

---

## 🤖 Tell Your AI Assistant (Antigravity, Gemini, Claude, Cursor)

Add this instruction to your AI assistant's system prompt or ask the assistant to read:
👉 [`client-kit/AI_INSTRUCTIONS.md`](./AI_INSTRUCTIONS.md)

> *"After making code changes or committing to git, execute `node client-kit/log.js` to automatically log your changes and commit tags to our central docsNlogs hub."*

---

## 🚀 CLI Logger Usage

### 1. Automatic Ingestion (Reads latest git commit & changed files)
```bash
node client-kit/log.js
```

### 2. Standard Commit Format
```bash
node client-kit/log.js "AB01(feat): add user authentication middleware"
node client-kit/log.js "AD02(fix): resolve mobile menu overflow bug"
```

### 3. Explicit Flags
```bash
node client-kit/log.js --scope backend --action feat --summary "Add Stripe webhook" --files "src/webhook.ts" --prompt "Handle stripe event"
```
