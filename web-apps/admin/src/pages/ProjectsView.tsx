import React, { useEffect, useState } from "react";
import axios from "axios";
import { FolderGit2, Plus, ExternalLink, GitBranch, Server, Tag, CheckCircle2, Layers } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  repo_url: string;
  current_version: string;
  latest_release_id: string;
  tech_stack_json: string;
  status: string;
  created_at: string;
}

export const ProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [version, setVersion] = useState("1.0.0");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/projects");
      if (res.data.success) {
        setProjects(res.data.projects || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Project name is required");
      return;
    }

    try {
      await axios.post("/api/projects/onboard", {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description,
        repoUrl,
      });
      toast.success(`Project [${name}] onboarded successfully!`);
      setOnboardModalOpen(false);
      setName("");
      setSlug("");
      setDescription("");
      fetchProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to onboard project");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-indigo-400" />
            Software Projects & Core Repositories
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Master catalog of software products, repositories, current versions, and client deployments.
          </p>
        </div>

        <button
          onClick={() => setOnboardModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Onboard Project
        </button>
      </div>

      {/* ── Projects Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          let techStack: string[] = [];
          try {
            techStack = JSON.parse(proj.tech_stack_json || "[]");
          } catch {}

          return (
            <div
              key={proj.id}
              className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 flex flex-col justify-between transition shadow-lg relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">{proj.name}</h3>
                      <span className="text-xs text-zinc-500 font-mono">ID: {proj.id || proj.slug}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-mono font-bold">
                    v{proj.current_version || "2.4.1"}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mt-4 line-clamp-3 leading-relaxed">
                  {proj.description || "No description provided."}
                </p>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 bg-zinc-950/70 border border-zinc-800 text-zinc-300 rounded text-[11px] font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Details */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                {proj.repo_url ? (
                  <a
                    href={proj.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    Repository ↗
                  </a>
                ) : (
                  <span className="text-zinc-500 font-mono">No repo linked</span>
                )}

                <span className="text-zinc-500 text-[11px]">
                  Created: {proj.created_at ? proj.created_at.slice(0, 10) : "2026-08"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Onboard Modal ── */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Onboard New Software Project</h2>
            <form onSubmit={handleOnboard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. B2B Travel ERP Engine"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Slug / Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. b2b-travels"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Git Repository URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the product and business scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
