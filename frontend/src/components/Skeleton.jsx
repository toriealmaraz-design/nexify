/**
 * Skeleton — reusable loading placeholders
 * Shimmer animation + midnight neon styling
 */

export function Skeleton({ width = '100%', height = '20px', className = '', rounded = 'rounded-xl' }) {
  return (
    <div
      className={`${rounded} skeleton-shimmer ${className}`}
      style={{ width, height, display: 'block' }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-[#1E1B4B] border border-white/10 ${className}`}>
      <div className="p-4">
        <Skeleton height="16px" width="60%" className="mb-3" />
        <Skeleton height="12px" width="40%" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ cols = 4, count = 4, className = '' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow({ count = 3, className = '' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5 mb-3">
          <Skeleton height="14px" width="50%" className="mb-2" />
          <Skeleton height="10px" width="30%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {['', '', '', ''].map((_, i) => (
        <div key={i} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4">
          <Skeleton height="14px" width="55%" className="mb-2" />
          <Skeleton height="28px" width="50%" />
        </div>
      ))}
    </div>
  );
}
