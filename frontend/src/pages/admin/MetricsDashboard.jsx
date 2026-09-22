/**
 * Admin — Global Metrics
 * Platform-wide financial analytics and user breakdown.
 *
 * API: GET /api/v1/admin/metrics
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, Lock, GraduationCap, Link2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';

export default function MetricsDashboard() {
  const { api } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/metrics')
      .then(r => setMetrics(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) {
    return (
      <div data-tour="admin-platform-metrics" className="max-w-5xl space-y-6">
        <Skeleton height="36px" width="200px" className="mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="max-w-5xl">
        <div className="bg-[#1E293B] border border-white/5 rounded-xl p-10 text-center">
          <p className="text-red-400">Failed to load metrics.</p>
        </div>
      </div>
    );
  }

  const { courses, users, financials, recentOrders } = metrics;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Global Metrics</h1>
        <p className="text-white/40 text-sm">Platform-wide financial analytics and user breakdown.</p>
      </div>

      {/* Financial summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: `GH\u8373 ${(financials.totalRevenueGhs || 0).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Platform Fees', value: `GH\u8373 ${(financials.totalPlatformFeesGhs || 0).toFixed(2)}`, icon: Lock, color: 'text-[#7C3AED]' },
          { label: 'Creator Earnings', value: `GH\u8373 ${(financials.totalCreatorEarningsGhs || 0).toFixed(2)}`, icon: GraduationCap, color: 'text-sky-400' },
          { label: 'Affiliate Earnings', value: `GH\u8373 ${(financials.totalAffiliateEarningsGhs || 0).toFixed(2)}`, icon: Link2, color: 'text-[#7C3AED]' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
          <div key={stat.label} className="bg-[#1E293B] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/40"><Icon className="w-5 h-5" /></span>
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Course stats */}
        <section className="bg-[#1E293B] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Course Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total', value: courses.total },
              { label: 'Published', value: courses.published, color: 'text-emerald-400' },
              { label: 'Pending', value: courses.pendingApproval, color: 'text-amber-400' },
              { label: 'Rejected', value: courses.rejected, color: 'text-red-400' },
            ].map(stat => (
              <div key={stat.label} className="p-3 bg-[#0F172A] rounded-lg">
                <p className="text-xs text-white/40 uppercase">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color || 'text-white'}`}>{stat.value ?? 0}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <span className="text-xs text-white/40">Platform Margin: </span>
            <span className="font-bold text-[#7C3AED]">{financials.platformMarginPercent?.toFixed(1) || 0}%</span>
          </div>
        </section>

        {/* User stats */}
        <section className="bg-[#1E293B] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Users by Role</h2>
          <div className="space-y-3">
            {users.byRole?.map(group => (
              <div key={group.role} className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg">
                <span className="capitalize font-medium text-white">{group.role?.toLowerCase()}</span>
                <span className="text-lg font-bold text-white">{group._count?.id ?? 0}</span>
              </div>
            )) || <p className="text-white/40">No users yet.</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-white/40 uppercase">Total Users</p>
            <p className="text-2xl font-bold text-white">{users.total ?? 0}</p>
          </div>
        </section>
      </div>

      {/* Recent orders */}
      <section className="mt-6 bg-[#1E293B] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Orders</h2>
        {recentOrders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 font-medium text-white/40 text-xs uppercase tracking-wider">Course</th>
                  <th className="text-left py-2 font-medium text-white/40 text-xs uppercase tracking-wider">Student</th>
                  <th className="text-right py-2 font-medium text-white/40 text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left py-2 font-medium text-white/40 text-xs uppercase tracking-wider">Affiliate</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3">
                      <span className="font-medium text-white">{order.course?.title}</span>
                    </td>
                    <td className="py-3 text-white/60">{order.student?.fullName}</td>
                    <td className="py-3 text-right font-medium text-white">GH\u8373 {((order.totalAmountGhs || 0)).toFixed(2)}</td>
                    <td className="py-3 text-white/40">{order.affiliateLink?.affiliateCode || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-white/40 text-center py-4">No orders yet.</p>
        )}
      </section>
    </div>
  );
}
