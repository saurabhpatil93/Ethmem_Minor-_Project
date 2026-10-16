'use client'

import { useState, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'

export default function MemoryGrowthChart({ memories = [], loading = false }) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Calculate monthly memory counts
  const monthlyData = useMemo(() => {
    if (!memories || memories.length === 0) {
      return Array(12).fill(0);
    }

    const counts = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    memories.forEach(memory => {
      const date = new Date(memory.timestamp);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        counts[month]++;
      }
    });

    return counts;
  }, [memories]);

  // Find the max value for scaling
  const maxValue = Math.max(...monthlyData, 1);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-48 bg-card-darker/50 rounded-lg p-4">
          <RefreshCw className="w-6 h-6 text-muted animate-spin" />
        </div>
      </div>
    );
  }

  if (monthlyData.every(v => v === 0)) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-48 bg-card-darker/50 rounded-lg p-4 text-muted">
          No memory data for this year
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-48 bg-card-darker/50 rounded-lg p-4">
        {monthlyData.map((count, i) => {
          const heightPercent = maxValue > 0 ? (count / maxValue) * 90 : 0;
          const isHighest = count === maxValue && count > 0;
          const isHovered = hoveredIndex === i;
          
          return (
            <div 
              key={i} 
              className="flex-1 flex flex-col items-center justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {isHovered && count > 0 && (
                <div className="absolute -mt-12 bg-emerald-900 text-emerald-300 px-2 py-1 rounded text-xs font-semibold shadow-lg z-10">
                  {count} {count === 1 ? 'memory' : 'memories'}
                </div>
              )}
              <div 
                className={`w-full rounded-t transition-all duration-300 ${
                  count === 0 
                    ? 'bg-card-darker border border-white/5' 
                    : isHighest 
                      ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/50' 
                      : 'bg-gradient-to-t from-emerald-700 to-emerald-600 group-hover:from-emerald-600 group-hover:to-emerald-500'
                } ${isHovered ? 'scale-105' : ''}`} 
                style={{height: `${Math.max(heightPercent, 5)}%`}}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-between text-xs text-muted px-2">
        {months.map((m,i)=> <div key={i} className="text-center">{m}</div>)}
      </div>
    </div>
  );
}

