/**
 * ⚡ docsNlogs Lightweight Frontend Client Engine
 * Reactive vanilla JS single-page application for centralized multi-project management.
 */

// Global Application State
const state = {
  projects: [],
  currentProject: "docsnlogs",
  logs: [],
  docs: [],
  features: [],
  activeTab: "logs",
  currentScopeFilter: "all",
  currentActionFilter: "all",
  searchQuery: "",
  selectedDocId: null,
};

// API Base URL
const API_BASE = window.location.origin + "/api";

/**
 * Initializes application on DOM content loaded
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  await fetchAllProjects();
});

/**
 * Fetches all registered projects from central Hub API
 */
const fetchAllProjects = async () => {
  try {
    const res = await fetch(`${API_BASE}/projects`);
    const data = await res.json();
    if (data.success && data.projects.length > 0) {
      state.projects = data.projects;

      // Check URL query param or fallback
      const urlParams = new URLSearchParams(window.location.search);
      const projParam = urlParams.get("project");
      const validProject = state.projects.find((p) => p.slug === projParam);

      if (validProject) {
        state.currentProject = validProject.slug;
      } else {
        state.currentProject = state.projects[0].slug;
      }

      renderProjectSelector();
      await loadCurrentProjectData();
    }
  } catch (err) {
    console.error("Failed to load projects:", err);
    showToast("Error connecting to Hub API", "error");
  }
};

/**
 * Renders project dropdown options in header
 */
const renderProjectSelector = () => {
  const select = document.getElementById("project-selector");
  if (!select) return;

  select.innerHTML = state.projects
    .map(
      (p) => `<option value="${p.slug}" ${p.slug === state.currentProject ? "selected" : ""}>
        ${p.name} (${p.slug})
      </option>`
    )
    .join("");
};

/**
 * Handles project selection change from dropdown
 * @param {string} projectSlug
 */
const onProjectChange = async (projectSlug) => {
  state.currentProject = projectSlug;
  const url = new URL(window.location.href);
  url.searchParams.set("project", projectSlug);
  window.history.replaceState({}, "", url.toString());

  await loadCurrentProjectData();
};

/**
 * Loads all logs, docs, and features for active project
 */
const loadCurrentProjectData = async () => {
  await Promise.all([fetchProjectStats(), fetchLogs(), fetchDocs(), fetchFeatures()]);
  if (window.lucide) lucide.createIcons();
};

/**
 * Fetches project stats & counts
 */
const fetchProjectStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/projects/${state.currentProject}`);
    const data = await res.json();
    if (data.success && data.stats) {
      document.getElementById("stat-logs").textContent = data.stats.logsCount || 0;
      document.getElementById("stat-docs").textContent = data.stats.docsCount || 0;
      document.getElementById("stat-features").textContent = data.stats.featuresCount || 0;
      document.getElementById("badge-logs-count").textContent = data.stats.logsCount || 0;
      document.getElementById("badge-docs-count").textContent = data.stats.docsCount || 0;
    }
  } catch (e) {}
};

/**
 * Refreshes current view data
 */
const refreshData = async () => {
  await loadCurrentProjectData();
  showToast("Live data refreshed");
};

/**
 * Switches active main navigation tab
 * @param {'logs' | 'docs' | 'features' | 'client-kit'} tabName
 */
const switchTab = (tabName) => {
  state.activeTab = tabName;

  // Update Buttons
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active", "bg-[#1e1b4b]", "text-[#a5b4fc]");
    btn.classList.add("text-slate-400");
  });

  const activeBtn = document.getElementById(`tab-btn-${tabName}`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.classList.remove("text-slate-400");
  }

  // Update Panes
  document.querySelectorAll(".tab-pane").forEach((pane) => pane.classList.add("hidden"));
  const activePane = document.getElementById(`tab-content-${tabName}`);
  if (activePane) {
    activePane.classList.remove("hidden");
  }

  if (window.lucide) lucide.createIcons();
};

// ============================================================================
// 1. ACTION LOGS & COMMITS MANAGEMENT
// ============================================================================

/**
 * Fetches AI action logs for the current project
 */
const fetchLogs = async () => {
  try {
    const res = await fetch(`${API_BASE}/projects/${state.currentProject}/logs?limit=150`);
    const data = await res.json();
    if (data.success) {
      state.logs = data.logs || [];
      renderLogs();
    }
  } catch (err) {
    console.error("Failed to load logs:", err);
  }
};

/**
 * Filters logs by scope pill (all, backend, frontend, architecture)
 * @param {string} scope
 */
const filterLogsByScope = (scope) => {
  state.currentScopeFilter = scope;
  document.querySelectorAll(".scope-pill").forEach((pill) => {
    pill.classList.remove("active", "bg-indigo-600", "text-white");
    pill.classList.add("bg-slate-800", "text-slate-300");
  });

  const activePill = document.getElementById(`scope-pill-${scope}`);
  if (activePill) {
    activePill.classList.add("active", "bg-indigo-600", "text-white");
    activePill.classList.remove("bg-slate-800", "text-slate-300");
  }

  renderLogs();
};

/**
 * Filters logs by action type (feat, fix, refc, docs, config)
 * @param {string} action
 */
const filterLogsByAction = (action) => {
  state.currentActionFilter = action;
  renderLogs();
};

/**
 * Handles global search input filtering
 * @param {string} query
 */
const handleSearch = (query) => {
  state.searchQuery = query.toLowerCase().trim();
  renderLogs();
  if (state.activeTab === "docs") {
    renderDocTree();
  }
};

/**
 * Renders action logs list
 */
const renderLogs = () => {
  const container = document.getElementById("logs-container");
  if (!container) return;

  let filtered = [...state.logs];

  // Scope filter
  if (state.currentScopeFilter !== "all") {
    filtered = filtered.filter(
      (l) => (l.scope || "").toLowerCase() === state.currentScopeFilter.toLowerCase()
    );
  }

  // Action type filter
  if (state.currentActionFilter !== "all") {
    filtered = filtered.filter(
      (l) => (l.action || "").toLowerCase() === state.currentActionFilter.toLowerCase()
    );
  }

  // Search query filter
  if (state.searchQuery) {
    const q = state.searchQuery;
    filtered = filtered.filter(
      (l) =>
        (l.id || "").toLowerCase().includes(q) ||
        (l.summary || "").toLowerCase().includes(q) ||
        (l.commit_id || "").toLowerCase().includes(q) ||
        (l.prompt_used || "").toLowerCase().includes(q) ||
        (l.changedFiles || []).some((f) => f.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
        <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
        <p class="text-sm font-medium">No action logs match your active filter or search.</p>
        <p class="text-xs text-slate-600 mt-1">Run <code class="text-indigo-400">node client-kit/log.js</code> to ingest a new log.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered
    .map((log) => {
      const isAB = (log.id || "").startsWith("AB") || log.scope === "backend";
      const isAA = (log.id || "").startsWith("AA") || log.scope === "architecture";
      const badgeClass = isAB ? "badge-ab" : isAA ? "badge-aa" : "badge-ad";

      const actionColors = {
        feat: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        fix: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        refc: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        docs: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        config: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      };
      const actionBadge = actionColors[log.action] || actionColors.feat;

      const formattedCommitMsg = `${log.id}(${log.action || "feat"}): ${log.summary}`;
      const timeAgo = formatTimeAgo(log.created_at);

      return `
        <div class="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all duration-200 shadow-sm space-y-3">
          
          <!-- Top Row: ID, Tags, Commit, Time -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded font-mono font-bold text-xs ${badgeClass}">
                #${log.id}
              </span>
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${actionBadge}">
                ${log.action || "feat"}
              </span>
              <span class="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-800/80 rounded border border-slate-700/50 capitalize">
                ${log.scope || "frontend"}
              </span>
              ${
                log.commit_id
                  ? `
                <button onclick="copyText('${log.commit_id}', 'Commit hash copied!')" class="flex items-center gap-1 px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-slate-800 hover:border-slate-700 rounded text-xs font-mono transition" title="Click to copy commit hash">
                  <i data-lucide="git-commit" class="w-3 h-3 text-indigo-400"></i>
                  <span>${log.commit_id.slice(0, 7)}</span>
                  <i data-lucide="copy" class="w-2.5 h-2.5 opacity-60"></i>
                </button>
              `
                  : ""
              }
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-400">
              <span title="${new Date(log.created_at).toLocaleString()}">${timeAgo}</span>
              <button onclick="deleteLog('${log.id}')" class="p-1 hover:text-rose-400 rounded transition" title="Delete log">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Middle Row: Summary & Direct Copy -->
          <div class="flex items-start justify-between gap-3">
            <div class="text-sm font-semibold text-white tracking-wide leading-relaxed">
              ${escapeHtml(log.summary)}
            </div>
            <button onclick="copyText('${escapeQuotes(formattedCommitMsg)}', 'Commit message copied!')" class="flex-shrink-0 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition" title="Copy formatted commit message">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Bottom Details: Changed Files & Prompt -->
          ${
            (log.changedFiles && log.changedFiles.length > 0) || log.prompt_used
              ? `
            <div class="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              
              <!-- Changed Files -->
              ${
                log.changedFiles && log.changedFiles.length > 0
                  ? `
                <div class="flex items-center gap-1.5 flex-wrap">
                  <i data-lucide="file-code" class="w-3.5 h-3.5 text-slate-500"></i>
                  ${log.changedFiles
                    .slice(0, 4)
                    .map(
                      (f) =>
                        `<span class="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-slate-300">${escapeHtml(
                          f
                        )}</span>`
                    )
                    .join("")}
                  ${
                    log.changedFiles.length > 4
                      ? `<span class="text-slate-500 text-[11px]">+${log.changedFiles.length - 4} more</span>`
                      : ""
                  }
                </div>
              `
                  : `<div></div>`
              }

              <!-- AI Prompt Used -->
              ${
                log.prompt_used
                  ? `
                <div class="flex items-center gap-1 text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80 text-[11px]" title="${escapeHtml(
                  log.prompt_used
                )}">
                  <i data-lucide="sparkles" class="w-3 h-3 text-amber-400"></i>
                  <span class="truncate max-w-[240px]">${escapeHtml(log.prompt_used)}</span>
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

        </div>
      `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
};

/**
 * Copies markdown changelog of current filtered logs to clipboard
 */
const exportMarkdownChangelog = () => {
  let filtered = [...state.logs];
  if (state.currentScopeFilter !== "all") {
    filtered = filtered.filter(
      (l) => (l.scope || "").toLowerCase() === state.currentScopeFilter.toLowerCase()
    );
  }

  if (filtered.length === 0) {
    showToast("No logs to export", "error");
    return;
  }

  let md = `# 📝 Changelog for ${state.currentProject}\n\n`;
  md += `Generated on ${new Date().toLocaleDateString()}\n\n`;

  filtered.forEach((l) => {
    const commit = l.commit_id ? ` (\`${l.commit_id.slice(0, 7)}\`)` : "";
    md += `- **#${l.id}** (${l.action || "feat"}): ${l.summary}${commit}\n`;
  });

  copyText(md, "Markdown Changelog copied to clipboard!");
};

/**
 * Deletes a single action log from D1
 * @param {string} logId
 */
const deleteLog = async (logId) => {
  if (!confirm(`Are you sure you want to delete log #${logId}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/projects/${state.currentProject}/logs/${logId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Log #${logId} deleted`);
      await fetchLogs();
      await fetchProjectStats();
    }
  } catch (err) {
    showToast("Failed to delete log", "error");
  }
};

// ============================================================================
// 2. DOCUMENTATION MANAGEMENT
// ============================================================================

/**
 * Fetches documentation for the current project
 */
const fetchDocs = async () => {
  try {
    const res = await fetch(`${API_BASE}/projects/${state.currentProject}/docs`);
    const data = await res.json();
    if (data.success) {
      state.docs = data.docs || [];
      renderDocTree();

      // Auto-select first doc if none selected
      if (state.docs.length > 0 && !state.selectedDocId) {
        selectDoc(state.docs[0].id);
      }
    }
  } catch (err) {
    console.error("Failed to load docs:", err);
  }
};

/**
 * Renders documentation categorized navigation tree
 */
const renderDocTree = () => {
  const container = document.getElementById("doc-tree-container");
  if (!container) return;

  if (state.docs.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-500 text-center py-4">No documents yet. Click "New Doc" to create one.</div>`;
    return;
  }

  // Group by category
  const categories = {};
  state.docs.forEach((doc) => {
    const cat = doc.category || "General";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(doc);
  });

  container.innerHTML = Object.keys(categories)
    .map((cat) => {
      const docsInCat = categories[cat];
      return `
        <div class="space-y-1">
          <div class="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
            <span>${escapeHtml(cat)}</span>
            <span class="text-[10px] text-slate-600">${docsInCat.length}</span>
          </div>
          <div class="space-y-0.5 pl-2">
            ${docsInCat
              .map(
                (doc) => `
              <button onclick="selectDoc('${doc.id}')" class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition flex items-center justify-between group ${
                  state.selectedDocId === doc.id
                    ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }">
                <span class="truncate">${escapeHtml(doc.title)}</span>
                <i data-lucide="chevron-right" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition ${
                  state.selectedDocId === doc.id ? "opacity-100 text-indigo-400" : ""
                }"></i>
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
};

/**
 * Selects and renders a document in the main viewer
 * @param {string} docId
 */
const selectDoc = (docId) => {
  state.selectedDocId = docId;
  const doc = state.docs.find((d) => d.id === docId);
  if (!doc) return;

  renderDocTree();

  document.getElementById("doc-title").textContent = doc.title;
  document.getElementById("doc-category-badge").textContent = doc.category || "General";
  document.getElementById("doc-author").textContent = `Author: ${doc.last_edited_by || "AI Assistant"}`;
  document.getElementById("doc-updated").textContent = `Updated: ${new Date(doc.updated_at).toLocaleDateString()}`;

  document.getElementById("edit-doc-btn").classList.remove("hidden");
  document.getElementById("copy-doc-btn").classList.remove("hidden");

  // Render Markdown with marked
  const contentBody = document.getElementById("doc-content-body");
  if (contentBody) {
    contentBody.innerHTML = marked.parse(doc.content || "*No content available.*");

    // Syntax highlight
    contentBody.querySelectorAll("pre code").forEach((el) => {
      hljs.highlightElement(el);

      // Add 1-click copy snippet button
      const pre = el.parentElement;
      if (pre && !pre.querySelector(".copy-snippet-btn")) {
        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-snippet-btn";
        copyBtn.textContent = "Copy";
        copyBtn.onclick = () => {
          copyText(el.innerText, "Code snippet copied!");
          copyBtn.textContent = "Copied!";
          setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
        };
        pre.appendChild(copyBtn);
      }
    });
  }

  if (window.lucide) lucide.createIcons();
};

/**
 * Opens doc modal for creating a new document
 */
const openNewDocModal = () => {
  document.getElementById("modal-doc-title").innerHTML = `<i data-lucide="file-plus" class="w-4 h-4 text-indigo-400"></i><span>Create Document</span>`;
  document.getElementById("edit-doc-id").value = "";
  document.getElementById("doc-input-title").value = "";
  document.getElementById("doc-input-content").value = "";
  openModal("modal-doc");
  if (window.lucide) lucide.createIcons();
};

/**
 * Opens doc modal to edit the currently selected document
 */
const editCurrentDoc = () => {
  const doc = state.docs.find((d) => d.id === state.selectedDocId);
  if (!doc) return;

  document.getElementById("modal-doc-title").innerHTML = `<i data-lucide="edit-3" class="w-4 h-4 text-indigo-400"></i><span>Edit Document</span>`;
  document.getElementById("edit-doc-id").value = doc.id;
  document.getElementById("doc-input-category").value = doc.category || "Architecture";
  document.getElementById("doc-input-title").value = doc.title;
  document.getElementById("doc-input-content").value = doc.content || "";

  openModal("modal-doc");
  if (window.lucide) lucide.createIcons();
};

/**
 * Submits doc form to save or update document
 */
const submitDocForm = async () => {
  const docId = document.getElementById("edit-doc-id").value;
  const category = document.getElementById("doc-input-category").value.trim();
  const title = document.getElementById("doc-input-title").value.trim();
  const content = document.getElementById("doc-input-content").value;

  if (!category || !title) {
    showToast("Category and title are required", "error");
    return;
  }

  try {
    const url = docId
      ? `${API_BASE}/projects/${state.currentProject}/docs/${docId}`
      : `${API_BASE}/projects/${state.currentProject}/docs`;
    const method = docId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title, content, lastEditedBy: "Developer" }),
    });
    const data = await res.json();
    if (data.success) {
      closeModal("modal-doc");
      showToast(docId ? "Document updated!" : "Document created!");
      await fetchDocs();
      await fetchProjectStats();
      if (data.doc) selectDoc(data.doc.id);
    }
  } catch (err) {
    showToast("Failed to save document", "error");
  }
};

/**
 * Copies current doc markdown to clipboard
 */
const copyCurrentDocMarkdown = () => {
  const doc = state.docs.find((d) => d.id === state.selectedDocId);
  if (doc) {
    copyText(doc.content || "", "Document Markdown copied!");
  }
};

// ============================================================================
// 3. FEATURES & JIRA HIERARCHY
// ============================================================================

/**
 * Fetches features and subtasks for current project
 */
const fetchFeatures = async () => {
  try {
    const res = await fetch(`${API_BASE}/projects/${state.currentProject}/features`);
    const data = await res.json();
    if (data.success) {
      state.features = data.features || [];
      renderFeatures();
    }
  } catch (err) {
    console.error("Failed to load features:", err);
  }
};

/**
 * Renders features tree
 */
const renderFeatures = () => {
  const container = document.getElementById("features-container");
  if (!container) return;

  if (state.features.length === 0) {
    container.innerHTML = `
      <div class="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
        No Epics or Features configured yet for this project.
      </div>
    `;
    return;
  }

  container.innerHTML = state.features
    .map((feat) => {
      const statusColors = {
        done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        in_progress: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        todo: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      };
      const statusBadge = statusColors[feat.status] || statusColors.todo;

      return `
        <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded font-mono font-bold text-xs">
                ${feat.key}
              </span>
              <h4 class="text-base font-bold text-white">${escapeHtml(feat.title)}</h4>
              <span class="px-2 py-0.5 text-xs uppercase font-semibold border rounded ${statusBadge}">
                ${feat.status.replace("_", " ")}
              </span>
            </div>
            <span class="text-xs text-slate-400 font-mono">${feat.subTasks?.length || 0} subtasks</span>
          </div>

          ${feat.description ? `<p class="text-xs text-slate-400">${escapeHtml(feat.description)}</p>` : ""}

          <!-- Subtasks List -->
          ${
            feat.subTasks && feat.subTasks.length > 0
              ? `
            <div class="space-y-2 pt-2 border-t border-slate-800/80">
              ${feat.subTasks
                .map(
                  (st) => `
                <div class="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-indigo-400 font-semibold">${st.key}</span>
                    <span class="text-slate-200 font-medium">${escapeHtml(st.title)}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] text-slate-500">${st.logs?.length || 0} commit logs</span>
                    <span class="px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold bg-slate-800 text-slate-400">${st.status}</span>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
      `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
};

// ============================================================================
// 4. PROJECT ONBOARDING MODAL
// ============================================================================

/**
 * Opens modal for creating a new project
 */
const openNewProjectModal = () => {
  document.getElementById("new-proj-name").value = "";
  document.getElementById("new-proj-slug").value = "";
  document.getElementById("new-proj-desc").value = "";
  openModal("modal-project");
};

/**
 * Submits new project onboarding payload to Hub API
 */
const submitNewProject = async () => {
  const name = document.getElementById("new-proj-name").value.trim();
  const slug = document.getElementById("new-proj-slug").value.trim();
  const description = document.getElementById("new-proj-desc").value.trim();

  if (!name) {
    showToast("Project name is required", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/projects/onboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description }),
    });
    const data = await res.json();
    if (data.success) {
      closeModal("modal-project");
      showToast(`Project ${name} onboarded!`);
      await fetchAllProjects();
      if (data.project) {
        onProjectChange(data.project.slug);
      }
    }
  } catch (err) {
    showToast("Failed to onboard project", "error");
  }
};

// ============================================================================
// 5. MODAL & TOAST HELPERS
// ============================================================================

/**
 * Opens target modal by ID
 * @param {string} modalId
 */
const openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
};

/**
 * Closes target modal by ID
 * @param {string} modalId
 */
const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
};

/**
 * Displays floating toast notification
 * @param {string} message
 * @param {'success' | 'error'} type
 */
const showToast = (message, type = "success") => {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toast-message");
  if (!toast || !msg) return;

  msg.textContent = message;
  toast.classList.remove("translate-y-20", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");

  setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0");
    toast.classList.remove("translate-y-0", "opacity-100");
  }, 2500);
};

/**
 * Copies text to clipboard and displays toast
 * @param {string} text
 * @param {string} toastMsg
 */
const copyText = (text, toastMsg = "Copied to clipboard!") => {
  navigator.clipboard.writeText(text).then(() => {
    showToast(toastMsg);
  });
};

/**
 * Copies preformatted code block content
 * @param {string} elementId
 */
const copyCode = (elementId) => {
  const el = document.getElementById(elementId);
  if (el) {
    copyText(el.innerText);
  }
};

/**
 * Helper to escape HTML tags for safe rendering
 * @param {string} str
 */
const escapeHtml = (str) => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

/**
 * Helper to escape single quotes for string interpolation
 * @param {string} str
 */
const escapeQuotes = (str) => {
  if (!str) return "";
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
};

/**
 * Formats relative time (e.g. 5m ago, 2h ago)
 * @param {string} dateStr
 */
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};
