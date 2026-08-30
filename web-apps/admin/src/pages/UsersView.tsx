import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users, Plus, Shield, CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  user_id: string;
  email: string;
  name: string;
  role: string;
  is_active: number;
  last_login_at: string;
  created_at: string;
}

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("engineer");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/users");
      if (res.data.success) {
        setUsers(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Name and Email are required");
      return;
    }

    try {
      await axios.post("/api/users", { name, email, role });
      toast.success(`Operator [${name}] onboarded successfully!`);
      setModalOpen(false);
      setName("");
      setEmail("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" />
            Dashboard Operators & Team Users
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage authenticated platform users, role-based access, and engineer credentials.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Operator
        </button>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/70 text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-5">Name & Email</th>
                <th className="py-3.5 px-5">User ID</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Last Login</th>
                <th className="py-3.5 px-5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-4 px-5">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-xs text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {u.email}
                    </div>
                  </td>
                  <td className="py-4 px-5 font-mono text-xs text-zinc-400">{u.user_id}</td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-xs font-semibold uppercase">
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </td>
                  <td className="py-4 px-5 font-mono text-xs text-zinc-400">
                    {u.last_login_at ? u.last_login_at.slice(0, 16).replace("T", " ") : "Never"}
                  </td>
                  <td className="py-4 px-5 font-mono text-xs text-zinc-500">
                    {u.created_at ? u.created_at.slice(0, 10) : "2026-08"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add User Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Add Dashboard Operator</h2>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ikram Lead Engineer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="operator@plexivia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="super_admin">Super Admin (Full Access)</option>
                  <option value="engineer">Engineer (Deployments & Releases)</option>
                  <option value="support_lead">Support Lead (Ticket Management)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
