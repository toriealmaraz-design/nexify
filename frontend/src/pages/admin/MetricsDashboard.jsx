/**
 * Admin — Global Metrics
 * Platform-wide financial analytics and user breakdown.
 *
 * API: GET /api/v1/admin/metrics
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/metrics')
      .then(r => r.json())
      .then(d => { setMetrics(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-400">Loading metrics...</div>;
  if (!metrics) return <div className="text-center py-8 text-red-400">Failed to load metrics.</div>;

  const { courses, users, financials, recentOrders } = metrics;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Global Metrics</h1>

      {/* Financial summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: `GH₵ ${(financials.totalRevenueGhs || 0).toFixed(2)}`, icon: '💰', color: 'text-emerald-600' },
          { label: 'Platform Fees', value: `GH₵ ${(financials.totalPlatformFeesGhs || 0).toFixed(2)}`, icon: '🔒', color: 'text-[#7C3AED]' },
          { label: 'Creator Earnings', value: `GH₵ ${(financials.totalCreatorEarningsGhs || 0).toFixed(2)}`, icon: '🎓', color: 'text-blue-600' },
          { label: 'Affiliate Earnings', value: `GH₵ ${(financials.totalAffiliateEarningsGhs || 0).toFixed(2)}`, icon: '🔗', color: 'text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-nexify shadow-card-sm border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Course stats */}
        <section className="bg-white rounded-nexify shadow-card-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Course Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total', value: courses.total },
              { label: 'Published', value: courses.published, color: 'text-emerald-600' },
              { label: 'Pending', value: courses.pendingApproval, color: 'text-amber-600' },
              { label: 'Rejected', value: courses.rejected, color: 'text-red-600' },
            ].map(stat => (
              <div key={stat.label} className="p-3 bg-[#EDE9FE] rounded-lg">
                <p className="text-xs text-slate-500 uppercase">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color || 'text-[#0F172A]'}`}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-500">Platform Margin: </span>
            <span className="font-bold text-[#7C3AED]">{financials.platformMarginPercent?.toFixed(1) || 0}%</span>
          </div>
        </section>

        {/* User stats */}
        <section className="bg-white rounded-nexify shadow-card-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Users by Role</h2>
          <div className="space-y-3">
            {users.byRole?.map(group => (
              <div key={group.role} className="flex items-center justify-between p-3 bg-[#EDE9FE] rounded-lg">
                <span className="capitalize font-medium text-[#0F172A]">{group.role?.toLowerCase()}</span>
                <span className="text-lg font-bold">{group._count.id}</span>
              </div>
            )) || <p className="text-slate-400">No users yet.</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 uppercase">Total Users</p>
            <p className="text-2xl font-bold text-[#0F172A]">{users.total}</p>
          </div>
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-6 bg-white rounded-nexify shadow-card-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-[#0F172A] mb-4">Recent Orders</h2>
        {recentOrders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="text-left py-2 font-medium">Course</th>
                  <th className="text-left py-2 font-medium">Student</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-left py-2 font-medium">Affiliate</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-slate-50">
                    <td className="py-2">
                      <span className="font-medium text-[#0F172A]">{order.course?.title}</span>
                    </td>
                    <td className="py-2 text-slate-600">{order.student?.fullName}</td>
                    <td className="py-2 text-right font-medium">GH₵ {((order.totalAmountGhs || 0)).toFixed(2)}</td>
                    <td className="py-2 text-slate-500">{order.affiliateLink?.affiliateCode || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 text-center py-4">No orders yet.</p>
        )}
      </section>
    </div>
  );
}
