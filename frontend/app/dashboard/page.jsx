'use client'

import { useState, useEffect } from 'react';
import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import StatCard from "./components/StatCard";
import MemoryGrowthChart from "./components/MemoryGrowthChart";
import RecentActivity from "./components/RecentActivity";
import UsagePie from "./components/UsagePie";
import ConnectedLLMs from "./components/ConnectedLLMs";
import UnifiedDataViewer from "./components/UnifiedDataViewer";
import extensionBridge from "../../lib/extensionBridge";

export default function DashboardPage() {
  // Load initial memories from localStorage
  const [memories, setMemories] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ethmem_dashboard_memories')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved dashboard memories:', e)
        }
      }
    }
    return []
  })
  const [contractMemories, setContractMemories] = useState([])
  const [loading, setLoading] = useState(true)
  // Load initial stats from localStorage
  const [stats, setStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ethmem_dashboard_stats')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved stats:', e)
        }
      }
    }
    return {
      totalMemories: 0,
      dataUsage: '0 MB',
      linkedApps: 0,
      growth: 0
    }
  })

  // Persist memories to localStorage whenever they change
  useEffect(() => {
    if (memories.length > 0) {
      try {
        localStorage.setItem('ethmem_dashboard_memories', JSON.stringify(memories))
      } catch (e) {
        console.error('Failed to save memories to localStorage:', e)
      }
    }
  }, [memories])

  // Persist stats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('ethmem_dashboard_stats', JSON.stringify(stats))
    } catch (e) {
      console.error('Failed to save stats to localStorage:', e)
    }
  }, [stats])

  useEffect(() => {
    loadDashboardData();
    
    // Set up interval to refresh data every 10 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const extensionAvailable = await extensionBridge.checkExtension();
      
      if (extensionAvailable) {
        const extensionMemories = await extensionBridge.getMemories();
        setMemories(extensionMemories || []);
        
        // Calculate stats
        const totalMemories = extensionMemories?.length || 0;
        
        // Calculate data usage
        const estimatedSize = extensionMemories?.reduce((total, m) => {
          const contentSize = JSON.stringify(m).length;
          return total + contentSize;
        }, 0) || 0;
        const sizeInMB = (estimatedSize / (1024 * 1024)).toFixed(2);
        
        // Count unique sources (linked applications)
        const uniqueSources = new Set(extensionMemories?.map(m => m.source) || []);
        const linkedApps = uniqueSources.size;
        
        // Calculate growth (last 7 days vs previous 7 days)
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
        
        const recentMemories = extensionMemories?.filter(m => m.timestamp >= sevenDaysAgo).length || 0;
        const previousMemories = extensionMemories?.filter(m => 
          m.timestamp >= fourteenDaysAgo && m.timestamp < sevenDaysAgo
        ).length || 0;
        
        const growth = previousMemories > 0 
          ? Math.round(((recentMemories - previousMemories) / previousMemories) * 100)
          : recentMemories > 0 ? 100 : 0;
        
        setStats({
          totalMemories,
          dataUsage: `${sizeInMB} MB`,
          linkedApps,
          growth
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-white flex relative">
      <Sidebar />

      <div className="flex-1 md:ml-64 p-4 md:p-6 lg:p-10">
        <DashboardHeader />

        {/* Unified Data Viewer */}
        <div className="mt-8">
          <UnifiedDataViewer onMemoriesUpdate={loadDashboardData} />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard 
              title="Data Usage" 
              value={loading ? '...' : stats.dataUsage} 
              delta={`${stats.totalMemories} memories stored`} 
            />
            <StatCard 
              title="Linked Applications" 
              value={loading ? '...' : stats.linkedApps.toString()} 
              delta={`${stats.totalMemories} total memories`} 
            />
            <StatCard 
              title="Total Memories" 
              value={loading ? '...' : stats.totalMemories.toLocaleString()} 
              delta={`${stats.growth >= 0 ? '+' : ''}${stats.growth}% last 7 days`} 
            />
          </div>

          <div className="space-y-4">
            <div className="bg-card-dark rounded-xl p-5 shadow-lg border border-white/5">
              <UsagePie memories={memories} loading={loading} />
            </div>
            <div className="bg-card-dark rounded-xl p-5 shadow-lg border border-white/5">
              <ConnectedLLMs memories={memories} loading={loading} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <h3 className="text-lg font-semibold mb-6 text-dark-primary">Memory Growth</h3>
            <MemoryGrowthChart memories={memories} loading={loading} />
          </div>

          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <h3 className="text-lg font-semibold mb-6 text-dark-primary">Recent Activity</h3>
            <RecentActivity memories={memories} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
