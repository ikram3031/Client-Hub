import React, { useEffect, useState } from "react";
import axios from "axios";
import { Tag, Plus, Rocket, GitCommit, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

interface Release {
  id: number;
  release_id: string;
  project_id: string;
  project_name?: string;
  version_tag: string;
  git_commit_sha: string;
  title: string;
  release_type: string;
  changelog_md: string;
  breaking_changes: string;
  is_published: number;
  published_at: string;
  created_at: string;
}

export const ReleasesView: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [rolloutLoading, setRolloutLoading] = useState<string | null>(null);

  // Form State
  const [projectId, setProjectId] = useState("prj_wlecom");
  const [versionTag, setVersionTag] = useState("");
  const [gitCommitSha, setGitCommitSha] = useState("");
  const [title, setTitle] = useState("");
  const [releaseType, setReleaseType] = useState("patch");
  const [changelogMd, setChangelogMd] = useState("");

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/releases");
      if (res.data.success) {
        setReleases(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch releases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handlePublishRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTag || !gitCommitSha || !title || !changelogMd) {
      toast.error("Please fill in all required release fields");
      return;
    }

    try {
      await axios.post("/api/releases", {
        projectId,
        versionTag,
        gitCommitSha,
        title,
        releaseType,
        changelogMd,
      });

      toast.success(`Release [${versionTag}] published successfully!`);
      setNewModalOpen(false);
      setVersionTag("");
      setGitCommitSha("");
      setTitle("");
      setChangelogMd("");
      fetchReleases();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish release");
    }
  };

  const handleRollout = async (releaseId: string, versionTag: string) => {
    setRolloutLoading(releaseId);
    try {
      const res = await axios.post(`/api/releases/${releaseId}/rollout`);
      toast.success(`Rollout queued for all clients to version [${versionTag}]!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger rollout");
    } finally {
      setRolloutLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Tag className="w-7 h-7 text-indigo-400" />
            Software Releases & Version Changelogs
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track white-label release milestones, Git commits, feature changes, and trigger 1-click fleet rollouts.
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Publish New Release
        </button>
      </div>

      {/* ── Releases Timeline ── */}
      <div className="space-y-6">
        {releases.map((rel) => (
          <div
            key={rel.id || rel.release_id}
            className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-sm font-mono font-bold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {rel.version_tag}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                      rel.release_type === "major"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : rel.release_type === "minor"
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {rel.release_type}
                  </span>

                  <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                    <GitCommit className="w-3.5 h-3.5" />
                    SHA: {rel.git_commit_sha}
                  </span>

                  <span className="text-xs text-zinc-500 font-mono">
                    Project: {rel.project_name || rel.project_id}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mt-2.5">{rel.title}</h2>
              </div>

              {/* Rollout Button */}
              <div className="flex flex-col sm:flex-row items-end gap-2">
                <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {rel.created_at ? rel.created_at.slice(0, 10) : "2026-08"}
                </span>

                <button
                  onClick={() => handleRollout(rel.release_id, rel.version_tag)}
                  disabled={rolloutLoading === rel.release_id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-md"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  {rolloutLoading === rel.release_id ? "Queueing Rollout..." : "Rollout to All Clients"}
                </button>
              </div>
            </div>

            {/* Markdown Changelog Body */}
            <div className="mt-4 bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
              {rel.changelog_md}
            </div>
          </div>
        ))}
      </div>

      {/* ── Publish Release Modal ── */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Publish New Software Release</h2>

            <form onSubmit={handlePublishRelease} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Version Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. v2.4.2"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Git Commit SHA</label>
                  <input
                    type="text"
                    placeholder="e.g. 799cee4"
                    value={gitCommitSha}
                    onChange={(e) => setGitCommitSha(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="prj_wlecom">WL-Ecom (eCommerce Engine)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Release Type</label>
                  <select
                    value={releaseType}
                    onChange={(e) => setReleaseType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="patch">Patch (Bug Fix)</option>
                    <option value="minor">Minor (New Feature)</option>
                    <option value="major">Major (Breaking Upgrade)</option>
                    <option value="hotfix">Hotfix</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Release Summary / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Real-time Inventory Lock & Meta Catalog Standard"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Changelog Details (Markdown)</label>
                <textarea
                  rows={4}
                  placeholder="- Feature 1: details&#10;- Fix 2: bug description&#10;- DB: index updates"
                  value={changelogMd}
                  onChange={(e) => setChangelogMd(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Publish Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
