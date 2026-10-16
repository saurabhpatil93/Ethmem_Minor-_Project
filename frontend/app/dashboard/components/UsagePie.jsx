export default function UsagePie({ memories = [], loading = false }) {
  // Calculate storage breakdown
  const calculateStorageBreakdown = () => {
    if (!memories || memories.length === 0) {
      return {
        total: '0 MB',
        local: 0,
        synced: 0,
        onChain: 0
      };
    }

    const localMemories = memories.filter(m => m.status === 'local');
    const syncedMemories = memories.filter(m => m.status === 'synced');
    const onChainMemories = memories.filter(m => m.status === 'on-chain');

    const calculateSize = (mems) => {
      const size = mems.reduce((total, m) => total + JSON.stringify(m).length, 0);
      return (size / (1024 * 1024)).toFixed(2);
    };

    const localSize = parseFloat(calculateSize(localMemories));
    const syncedSize = parseFloat(calculateSize(syncedMemories));
    const onChainSize = parseFloat(calculateSize(onChainMemories));
    const totalSize = (localSize + syncedSize + onChainSize).toFixed(2);

    return {
      total: `${totalSize} MB`,
      local: localSize,
      synced: syncedSize,
      onChain: onChainSize
    };
  };

  const storage = calculateStorageBreakdown();

  return (
    <div>
      <h4 className="font-semibold mb-4 text-dark-primary">Storage Used</h4>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/30">
            {loading ? '...' : storage.total}
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent animate-pulse"></div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="text-sm text-sidebar-text">Local</div>
            <div className="text-sm text-muted ml-auto">{storage.local.toFixed(2)} MB</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <div className="text-sm text-sidebar-text">Synced</div>
            <div className="text-sm text-muted ml-auto">{storage.synced.toFixed(2)} MB</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <div className="text-sm text-sidebar-text">On-Chain</div>
            <div className="text-sm text-muted ml-auto">{storage.onChain.toFixed(2)} MB</div>
          </div>
        </div>
      </div>
    </div>
  );
}

