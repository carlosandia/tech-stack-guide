/**
 * AIDEV-NOTE: Skeleton loader completo do Dashboard (PRD-18)
 * Exibido durante carregamento — sem "—" visível
 */

function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-muted/50 rounded animate-pulse ${className}`} />
  )
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SkeletonBar className="h-6 w-48 mb-2" />
          <SkeletonBar className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <SkeletonBar className="h-9 w-64 rounded-lg" />
          <SkeletonBar className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* Funil */}
      <div className="bg-card border border-border rounded-xl p-6">
        <SkeletonBar className="h-4 w-40 mb-6" />
        <div className="hidden md:flex items-stretch gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <SkeletonBar className="w-8 h-8 rounded-lg" />
                <SkeletonBar className="h-3 w-12" />
              </div>
              <SkeletonBar className="h-8 w-16 mb-1" />
              <SkeletonBar className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="md:hidden space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <SkeletonBar className="w-10 h-10 rounded-lg" />
                <div>
                  <SkeletonBar className="h-3 w-14 mb-1" />
                  <SkeletonBar className="h-6 w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invest Mode Banner */}
      <SkeletonBar className="h-16 w-full rounded-xl" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <SkeletonBar className="w-8 h-8 rounded-lg" />
              <SkeletonBar className="h-3 w-20" />
            </div>
            <SkeletonBar className="h-8 w-24 mb-1" />
            <SkeletonBar className="h-3 w-12" />
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <SkeletonBar className="h-4 w-44 mb-6" />
        <div className="flex flex-col lg:flex-row gap-6">
          <SkeletonBar className="w-full lg:w-48 h-48 rounded-full mx-auto lg:mx-0" />
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <SkeletonBar className="h-3 w-24" />
                  <SkeletonBar className="h-3 w-32" />
                </div>
                <SkeletonBar className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
