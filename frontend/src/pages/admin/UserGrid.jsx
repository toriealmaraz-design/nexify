/**
 * Admin — User Management Grid
 * Paginated user list with role filtering and role update.
 *
 * API: GET /api/v1/admin/users?page=&limit=&role=
 *      PUT /api/v1/admin/users/:userId/role { role }
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/Skeleton';

const VALID_ROLES = ['ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT'];

export default function UserGrid() {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const limit = 20;
  const totalPages = Math.ceil(total / limit) || 1;

  function loadPage(p) {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit });
    if (roleFilter !== 'all') params.set('role', roleFilter);
    api.get(`/admin/users?${params}`)
      .then(r => {
        setUsers(r.data.data || []);
        setTotal(r.data.meta?.totalItems || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadPage(1); }, [roleFilter, api]);

  useEffect(() => { loadPage(page); }, [page, api]);

  async function updateRole(userId, newRole) {
    setActionLoading(userId);
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: data.data.role } : u));
      }
    } catch {}
    setActionLoading(null);
  }

  if (loading && users.length === 0) {
    return (
      <div className="max-w-5xl space-y-4">
        <Skeleton height="36px" width="200px" className="mb-6" />
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-6 space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} height="48px" />)}
        </div>
      </div>
    );
  }

  return (
    <div data-tour="admin-user-grid" className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
        <p className="text-white/40 text-sm">Manage users, roles, and creator trust tiers.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <label className="text-sm text-white/40">Filter by role:</label>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-[#1E293B] border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
        >
          <option value="all">All Roles</option>
          {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {users.length === 0 ? (
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-10 text-center">
          <p className="text-white/40">No users found.</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1E293B] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 font-medium text-white/40 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-white/40 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-white/40 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-white/40 text-xs uppercase tracking-wider">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-white/40 text-xs uppercase tracking-wider">Joined</th>
                  <th className="text-right py-3 px-4 font-medium text-white/40 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{user.fullName}</td>
                    <td className="py-3 px-4 text-white/60">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400'
                        : user.role === 'CREATOR' ? 'bg-sky-500/20 text-sky-400'
                        : user.role === 'AFFILIATE' ? 'bg-[#7C3AED]/20 text-[#7C3AED]'
                        : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/40">{user.phone || '—'}</td>
                    <td className="py-3 px-4 text-white/40 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={user.role}
                        onChange={e => updateRole(user.id, e.target.value)}
                        disabled={actionLoading === user.id}
                        className="bg-[#1E293B] border border-white/10 text-white text-xs rounded-lg px-2 py-1 capitalize focus:outline-none focus:ring-2 focus:ring-[#7C3AED] disabled:opacity-50"
                      >
                        {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-white/40">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-[#1E293B] border border-white/10 text-white text-sm rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-[#1E293B] border border-white/10 text-white text-sm rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
