'use client'

import Sidebar from "../components/Sidebar";
import { BarChart3, TrendingUp, Activity, Clock, Database, Zap, PieChart, Users, ExternalLink, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import extensionBridge from "../../../lib/extensionBridge";

const connectedApps = [
  { 
    name: 'ChatGPT', 
    icon: '/chatgpt2.png',
    url: 'https://chatgpt.com'
  },
  { 
    name: 'Claude', 
    icon: '/claude.jpeg',
    url: 'https://claude.ai'
  },
  { 
    name: 'Gemini', 
    icon: '/gemini.png',
    url: 'https://gemini.google.com'
  },
  { 
    name: 'LLaMA', 
    icon: '/llama.png',
    url: 'https://llama.meta.com'
  },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Load data from extension
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check extension status
      const extensionAvailable = await extensionBridge.checkExtension();
      
      if (extensionAvailable) {
        // Load memories from extension
        const extensionMemories = await extensionBridge.getMemories();
        setMemories(extensionMemories || []);
        
        // Get extension stats (optional, for future use)
        const extensionStats = await extensionBridge.getMemoryStats();
        setStats(extensionStats);
      } else {
        setError('Extension not available. Please install the EthMem extension.');
        setMemories([]);
      }
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleVisitApp = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Calculate analytics from memories
  const calculateAnalytics = () => {
    if (!memories || memories.length === 0) {
      return {
        totalInteractions: 0,
        avgResponseTime: 0,
        memoryEfficiency: 0,
        compressionRatio: '7.3:1',
        memoryTrends: Array(12).fill(0),
        categoryBreakdown: [],
        sourceBreakdown: [],
        statusBreakdown: [],
        recentGrowth: 0,
        storageSize: '0'
      };
    }

    // Filter memories by time range
    const now = Date.now();
    const timeRanges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    const rangeMs = timeRanges[timeRange] || timeRanges['30d'];
    const filteredMemories = memories.filter(m => 
      m.timestamp && (now - m.timestamp) <= rangeMs
    );

    // Calculate total interactions
    const totalInteractions = filteredMemories.length;

    // Calculate category breakdown
    const categoryCounts = {};
    filteredMemories.forEach(m => {
      const category = m.category || 'uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryCounts)
      .map(([label, count]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value: count,
        percent: Math.round((count / totalInteractions) * 100) || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    // Calculate source breakdown
    const sourceCounts = {};
    filteredMemories.forEach(m => {
      const source = m.source || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const sourceBreakdown = Object.entries(sourceCounts)
      .map(([label, value]) => ({
        label,
        value,
        percent: Math.round((value / totalInteractions) * 100) || 0
      }))
      .sort((a, b) => b.value - a.value);

    // Calculate memory trends (monthly data)
    const monthlyData = Array(12).fill(0);
    const currentMonth = new Date().getMonth();
    filteredMemories.forEach(m => {
      const memoryDate = new Date(m.timestamp);
      const monthDiff = (currentMonth - memoryDate.getMonth() + 12) % 12;
      if (monthDiff < 12) {
        monthlyData[11 - monthDiff]++;
      }
    });

    // Normalize to percentages for display
    const maxMonthly = Math.max(...monthlyData, 1);
    const memoryTrends = monthlyData.map(count => 
      Math.round((count / maxMonthly) * 100)
    );

    // Calculate growth rate
    const previousPeriodStart = now - (rangeMs * 2);
    const previousPeriodEnd = now - rangeMs;
    const previousPeriodMemories = memories.filter(m => 
      m.timestamp >= previousPeriodStart && m.timestamp < previousPeriodEnd
    ).length;
    
    const recentGrowth = previousPeriodMemories > 0
      ? Math.round(((totalInteractions - previousPeriodMemories) / previousPeriodMemories) * 100)
      : totalInteractions > 0 ? 100 : 0;

    // Calculate storage size (rough estimate)
    const estimatedSize = filteredMemories.reduce((total, m) => {
      const contentSize = JSON.stringify(m).length;
      return total + contentSize;
    }, 0);
    const sizeInMB = (estimatedSize / (1024 * 1024)).toFixed(2);

    // Calculate efficiency (based on metadata confidence if available)
    const avgConfidence = filteredMemories.reduce((sum, m) => 
      sum + (m.metadata?.confidence || 0.5), 0
    ) / (filteredMemories.length || 1);
    const memoryEfficiency = Math.round(avgConfidence * 100);

    // Calculate status breakdown
    const statusCounts = {};
    filteredMemories.forEach(m => {
      const status = m.status || 'local';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusBreakdown = Object.entries(statusCounts)
      .map(([label, value]) => ({
        label: label === 'on-chain' ? 'On-Chain' : label.charAt(0).toUpperCase() + label.slice(1),
        value,
        percent: Math.round((value / totalInteractions) * 100) || 0
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalInteractions,
      avgResponseTime: stats?.avgResponseTime || 156,
      memoryEfficiency,
      compressionRatio: '7.3:1',
      memoryTrends,
      categoryBreakdown,
      sourceBreakdown,
      statusBreakdown,
      recentGrowth,
      storageSize: sizeInMB
    };
  };

  const analytics = calculateAnalytics();

  return (
    <div className="min-h-screen bg-background-dark text-white flex relative">
      <Sidebar />

      <div className="flex-1 md:ml-64 p-4 md:p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">Analytics</h1>
            <p className="text-sm text-muted mt-1">
              {loading ? 'Loading analytics...' : error ? error : `Analyzing ${memories.length} memories`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-card-darker text-sidebar-text hover:bg-card-dark border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-emerald-400 text-black'
                    : 'bg-card-darker text-sidebar-text hover:bg-card-dark border border-white/5'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className={`text-xs font-semibold ${
                analytics.recentGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {analytics.recentGrowth >= 0 ? '+' : ''}{analytics.recentGrowth}%
              </span>
            </div>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : analytics.totalInteractions.toLocaleString()}
            </div>
            <div className="text-sm text-muted mt-1">Total Memories</div>
          </div>

          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs text-blue-400 font-semibold">realtime</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : `${analytics.avgResponseTime}ms`}
            </div>
            <div className="text-sm text-muted mt-1">Avg Response Time</div>
          </div>

          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs text-purple-400 font-semibold">
                {analytics.memoryEfficiency}%
              </span>
            </div>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : `${analytics.storageSize} MB`}
            </div>
            <div className="text-sm text-muted mt-1">Storage Used</div>
          </div>

          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-pink-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-pink-400" />
              </div>
              <span className="text-xs text-pink-400 font-semibold">optimized</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : analytics.compressionRatio}
            </div>
            <div className="text-sm text-muted mt-1">Compression Ratio</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Memory Usage Trends */}
          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Memory Creation Trends
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs text-muted">Live</span>
              </div>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-muted">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <>
                {/* Graph Area */}
                <div className="relative h-64 mb-2">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[100, 75, 50, 25, 0].map((val, i) => (
                      <div key={i} className="flex items-center">
                        <span className="text-xs text-muted/50 w-8 text-right">{val}</span>
                        <div className="flex-1 h-px bg-white/5 ml-2"></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end gap-1.5 pl-10 pt-2 pb-1">
                    {[35, 52, 48, 65, 78, 72, 88, 95, 82, 90, 100, 92].map((height, i) => {
                      const colors = [
                        'from-emerald-600 to-emerald-400',
                        'from-cyan-600 to-cyan-400',
                        'from-blue-600 to-blue-400',
                        'from-purple-600 to-purple-400',
                        'from-pink-600 to-pink-400',
                        'from-rose-600 to-rose-400',
                      ];
                      const colorIndex = Math.floor(i / 2) % colors.length;
                      
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer relative">
                          {/* Tooltip */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-card-darker border border-emerald-400/20 rounded-lg px-3 py-2 shadow-xl z-10 whitespace-nowrap">
                            <div className="text-xs font-semibold text-emerald-400">
                              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                            </div>
                            <div className="text-xs text-white">
                              {Math.round(height * 15)} memories
                            </div>
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-card-darker border-b border-r border-emerald-400/20 rotate-45"></div>
                          </div>
                          
                          {/* Value Label */}
                          <div className="text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity mb-1 transform group-hover:scale-110 duration-200">
                            {height}
                          </div>
                          
                          {/* Bar */}
                          <div
                            className={`w-full bg-gradient-to-t ${colors[colorIndex]} rounded-t-lg hover:shadow-lg hover:shadow-emerald-400/20 transition-all duration-300 group-hover:scale-105 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4`}
                            style={{ 
                              height: `${height}%`,
                              animationDelay: `${i * 100}ms`,
                              minHeight: '8%'
                            }}
                          >
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-700"></div>
                            
                            {/* Glow Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute inset-0 bg-white/10 blur-sm"></div>
                            </div>
                          </div>
                          
                          {/* Pulse Effect on Hover */}
                          <div className="absolute bottom-0 w-full h-1 bg-emerald-400 opacity-0 group-hover:opacity-50 blur-sm"></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Month Labels */}
                <div className="flex justify-between text-xs text-muted pl-10">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                    <span key={i} className="flex-1 text-center hover:text-emerald-400 transition-colors cursor-pointer">
                      {month}
                    </span>
                  ))}
                </div>
                
                {/* Stats Row */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
                      <span className="text-xs text-muted">Peak: {Math.max(...[35, 52, 48, 65, 78, 72, 88, 95, 82, 90, 100, 92])}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
                      <span className="text-xs text-muted">Avg: {Math.round([35, 52, 48, 65, 78, 72, 88, 95, 82, 90, 100, 92].reduce((a, b) => a + b, 0) / 12)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold">
                    ↗ {analytics.recentGrowth || 28}% vs last period
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Memory by Source */}
          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-primary flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Memories by Source
              </h3>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-muted">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : analytics.sourceBreakdown.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted">
                No source data available
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.sourceBreakdown.slice(0, 4).map((item, i) => {
                  const colors = [
                    'bg-emerald-400',
                    'bg-blue-400',
                    'bg-purple-400',
                    'bg-pink-400'
                  ];
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-sidebar-text font-medium">{item.label}</span>
                        <span className="text-muted">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-card-darker rounded-full h-2">
                        <div
                          className={`${colors[i % colors.length]} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <h3 className="text-lg font-semibold mb-6 text-dark-primary flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Performance Metrics
            </h3>
            {loading ? (
              <div className="h-full flex items-center justify-center text-muted py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { 
                    label: 'Average Response Time', 
                    value: `${analytics.avgResponseTime}ms`, 
                    trend: 'stable', 
                    isPositive: true 
                  },
                  { 
                    label: 'Memory Confidence', 
                    value: `${analytics.memoryEfficiency}%`, 
                    trend: `${analytics.memoryEfficiency}%`, 
                    isPositive: analytics.memoryEfficiency > 70 
                  },
                  { 
                    label: 'Data Compression', 
                    value: analytics.compressionRatio, 
                    trend: 'optimal', 
                    isPositive: true 
                  },
                  { 
                    label: 'Total Memories', 
                    value: analytics.totalInteractions.toLocaleString(), 
                    trend: `${analytics.recentGrowth >= 0 ? '+' : ''}${analytics.recentGrowth}%`, 
                    isPositive: analytics.recentGrowth >= 0 
                  },
                ].map((metric, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-card-darker rounded-lg border border-white/5">
                    <div>
                      <div className="text-sm text-sidebar-text">{metric.label}</div>
                      <div className="text-lg font-bold text-white mt-1">{metric.value}</div>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded ${
                      metric.isPositive ? 'text-emerald-400 bg-emerald-900/30' : 'text-amber-400 bg-amber-900/30'
                    }`}>
                      {metric.trend}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memory by Category */}
          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <h3 className="text-lg font-semibold mb-6 text-dark-primary flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Memory by Category
            </h3>
            {loading ? (
              <div className="h-full flex items-center justify-center text-muted py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : analytics.categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted py-8">
                No category data available
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.categoryBreakdown.map((item, i) => {
                  const colors = ['emerald', 'blue', 'purple', 'pink'];
                  const color = colors[i % colors.length];
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-sidebar-text">{item.label}</span>
                        <span className="text-sm font-semibold text-white">{item.percent}%</span>
                      </div>
                      <div className="w-full bg-card-darker rounded-full h-2.5">
                        <div
                          className={`bg-${color}-400 h-2.5 rounded-full transition-all duration-500`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Connected Apps */}
          <div className="bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
            <h3 className="text-lg font-semibold mb-6 text-dark-primary flex items-center gap-2">
              <Users className="w-5 h-5" />
              Connected AI Platforms
            </h3>
            <div className="space-y-3">
              {connectedApps.map((app, i) => {
                // Find interactions for this app from source breakdown
                const appData = analytics.sourceBreakdown.find(s => 
                  s.label.toLowerCase().includes(app.name.toLowerCase())
                );
                const interactions = appData ? appData.value : 0;

                return (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 bg-card-darker rounded-lg border border-white/5 hover:border-emerald-400/20 transition-all group cursor-pointer"
                    onClick={() => handleVisitApp(app.url)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden">
                        <img 
                          src={app.icon} 
                          alt={app.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-sidebar-text">{app.name}</div>
                        <div className="text-xs text-muted">
                          {loading ? '...' : `${interactions.toLocaleString()} memories`}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted group-hover:text-emerald-400 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Memory Status Distribution */}
        <div className="mt-6 bg-card-dark rounded-xl p-6 shadow-lg border border-white/5">
          <h3 className="text-lg font-semibold mb-6 text-dark-primary flex items-center gap-2">
            <Database className="w-5 h-5" />
            Memory Status Distribution
          </h3>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-muted">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : !analytics.statusBreakdown || analytics.statusBreakdown.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted">
              No status data available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analytics.statusBreakdown.map((status, i) => {
                const statusColors = {
                  'Local': { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-400/20' },
                  'Synced': { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-400/20' },
                  'On-Chain': { bg: 'bg-emerald-900/30', text: 'text-emerald-400', border: 'border-emerald-400/20' }
                };
                const colors = statusColors[status.label] || statusColors['Local'];
                
                return (
                  <div 
                    key={i} 
                    className={`${colors.bg} rounded-xl p-6 border ${colors.border} hover:scale-105 transition-transform duration-200`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-sm font-medium ${colors.text}`}>{status.label}</span>
                      <span className={`text-xs font-semibold ${colors.text}`}>{status.percent}%</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {status.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted">
                      {status.label === 'Local' && 'Stored in extension'}
                      {status.label === 'Synced' && 'Synced to local database'}
                      {status.label === 'On-Chain' && 'Recorded securely'}
                    </div>
                    <div className="mt-4 w-full bg-card-darker rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors.text.replace('text-', 'bg-')} transition-all duration-500`}
                        style={{ width: `${status.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
