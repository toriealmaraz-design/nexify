/**
 * Admin — User Management Grid
 * Paginated user list with role filtering and role update.
 *
 * API: GET /api/v1/admin/users?page=&limit=&role=
 *      PUT /api/v1/admin/users/:userId/role { role }
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const VALID_ROLES = ['ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT'];

export default function UserGrid() {
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
    fetch(`/api/v1/admin/users?${params}`)
      .then(r => r.json())
      .then(d => {
        setUsers(d.data || []);
        setTotal(d.meta?.totalItems || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadPage(1); }, [roleFilter]);

  useEffect(() => { loadPage(page); }, [page]);

  async function updateRole(userId, newRole) {
    setActionLoading(userId);
    const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (data.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: data.data.role } : u));
    }
    setActionLoading(null);
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">User Management</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <label className="text-sm text-slate-500">Filter by role:</label>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Roles</option>
          {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading && users.length === 0 ? (
        <div className="text-center py-8 text-slate-400">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-nexify border border-slate-100 p-10 text-center">
          <p className="text-slate-400">No users found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-nexify shadow-card-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-[#EDE9FE]">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Joined</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 px-4 font-medium text-[#0F172A]">{user.fullName}</td>
                    <td className="py-3 px-4 text-slate-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-700'
                        : user.role === 'CREATOR' ? 'bg-blue-100 text-blue-700'
                        : user.role === 'AFFILIATE' ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{user.phone || '—'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={user.role}
                        onChange={e => updateRole(user.id, e.target.value)}
                        disabled={actionLoading === user.id}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs capitalize disabled:opacity-50"
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
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
