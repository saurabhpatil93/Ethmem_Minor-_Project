import { Plus, Database, Upload, Tag, RefreshCw } from 'lucide-react'

export default function RecentActivity({ memories = [], loading = false }) {
  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      location: 'bg-blue-600',
      food: 'bg-red-600',
      hobby: 'bg-green-600',
      skill: 'bg-purple-600',
      language: 'bg-yellow-600',
      preference: 'bg-pink-600',
      name: 'bg-indigo-600',
      age: 'bg-orange-600',
      occupation: 'bg-teal-600'
    };
    return colors[category] || 'bg-emerald-600';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'on-chain': return Upload;
      case 'synced': return Database;
      case 'local':
      default: return Plus;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 text-muted animate-spin" />
      </div>
    );
  }

  // Get the 5 most recent memories
  const recentMemories = [...memories]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  if (recentMemories.length === 0) {
    return (
      <div className="text-sm text-muted text-center py-8">
        No recent activity
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {recentMemories.map((memory, idx) => {
        const Icon = getStatusIcon(memory.status);
        const color = getCategoryColor(memory.category);
        
        return (
          <li key={memory.id || idx} className="flex items-start gap-3 group">
            <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sidebar-text text-sm group-hover:text-emerald-300 transition-colors truncate">
                {memory.entity || 'Memory'}
              </div>
              <div className="text-xs text-muted mt-0.5 flex items-center gap-2">
                <span className="truncate">
                  {memory.source || 'Unknown'} • {memory.category || 'uncategorized'}
                </span>
              </div>
              <div className="text-xs text-muted/70 mt-0.5">
                {formatTimestamp(memory.timestamp)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

