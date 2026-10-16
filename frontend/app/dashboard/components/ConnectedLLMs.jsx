import { Brain, Zap, Clock } from 'lucide-react'

export default function ConnectedLLMs({ memories = [], loading = false }) {
  // Extract unique sources and their last interaction
  const getConnectedSources = () => {
    if (!memories || memories.length === 0) {
      return [];
    }

    const sourceMap = new Map();
    
    memories.forEach(memory => {
      const source = memory.source || 'Unknown';
      if (!sourceMap.has(source) || memory.timestamp > sourceMap.get(source).timestamp) {
        sourceMap.set(source, {
          name: source,
          timestamp: memory.timestamp,
          count: (sourceMap.get(source)?.count || 0) + 1
        });
      } else {
        const existing = sourceMap.get(source);
        existing.count += 1;
      }
    });

    return Array.from(sourceMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3); // Show top 3 most recent
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return 'Over a week ago';
  };

  const connectedSources = getConnectedSources();

  if (loading) {
    return (
      <div>
        <h4 className="font-semibold mb-4 text-dark-primary">Connected Sources</h4>
        <div className="flex items-center justify-center py-8 text-muted">
          <Clock className="w-5 h-5 animate-spin" />
        </div>
      </div>
    );
  }

  if (connectedSources.length === 0) {
    return (
      <div>
        <h4 className="font-semibold mb-4 text-dark-primary">Connected Sources</h4>
        <div className="text-sm text-muted text-center py-8">
          No sources connected yet
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold mb-4 text-dark-primary">Connected Sources</h4>
      <ul className="space-y-3">
        {connectedSources.map((source, idx) => (
          <li key={idx} className="flex items-center justify-between bg-card-darker p-3 rounded-lg border border-white/5 hover:border-emerald-400/20 transition-all duration-200 group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-900/30 rounded-lg group-hover:bg-emerald-900/50 transition-colors">
                <Brain className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-sidebar-text text-sm">{source.name}</div>
                <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(source.timestamp)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-400">{source.count}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

