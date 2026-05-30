'use client';

export default function CDRModeIndicator() {
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_CDR === 'true';

  if (!isMockMode) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-amber-200">
            Demo Mode - Using simulated CDR
          </span>
        </div>
      </div>
    </div>
  );
}
