'use client'

import Sidebar from "../components/Sidebar";
import { Settings, ExternalLink, Plus, Check, X, Zap, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const integrations = [
  {
    name: "ChatGPT",
    description: "AI-powered conversational assistant",
    status: "available",
    icon: "/chatgpt2.png",
    lastSync: null,
    interactions: "0",
    url: "https://chatgpt.com"
  },
  {
    name: "Claude AI",
    description: "Advanced AI assistant by Anthropic",
    status: "available",
    icon: "/claude.jpeg",
    lastSync: null,
    interactions: "0",
    url: "https://claude.ai"
  },
  {
    name: "Gemini",
    description: "Google's multimodal AI model",
    status: "available",
    icon: "/gemini.png",
    lastSync: null,
    interactions: "0",
    url: "https://gemini.google.com"
  },
  {
    name: "LLaMA",
    description: "Meta's large language model",
    status: "available",
    icon: "/llama.png",
    lastSync: null,
    interactions: "0",
    url: "https://llama.meta.com"
  },
  {
    name: "ASI",
    description: "Artificial Superintelligence Network",
    status: "available",
    icon: "/asi.png",
    lastSync: null,
    interactions: "0",
    url: "https://fetch.ai"
  }
];

const availableIntegrations = [
  {
    name: "Notion",
    description: "Connect your Notion workspace for seamless memory storage",
    icon: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    category: "Productivity",
    popular: true
  },
  {
    name: "Google Drive",
    description: "Backup memories to your Google Drive",
    icon: "https://ssl.gstatic.com/images/branding/product/2x/hh_drive_96dp.png",
    category: "Storage",
    popular: false
  },
  {
    name: "Slack",
    description: "Enhanced team communication with memory context",
    icon: "https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg",
    category: "Communication",
    popular: true
  },
  {
    name: "Discord",
    description: "AI memory integration for Discord servers",
    icon: "https://cdn.worldvectorlogo.com/logos/discord-6.svg",
    category: "Communication",
    popular: false
  },
  {
    name: "Obsidian",
    description: "Sync your knowledge base with AI memory",
    icon: "https://upload.wikimedia.org/wikipedia/commons/1/10/2023_Obsidian_logo.svg",
    category: "Productivity",
    popular: false
  },
  {
    name: "Zapier",
    description: "Automate workflows with memory data",
    icon: "https://cdn.worldvectorlogo.com/logos/zapier.svg",
    category: "Automation",
    popular: true
  }
];

export default function IntegrationsPage() {
  const [filter, setFilter] = useState('all');

  const filteredIntegrations = filter === 'all' 
    ? availableIntegrations 
    : availableIntegrations.filter(i => i.category === filter);

  const handleVisitWebsite = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background-dark text-white flex relative">
      <Sidebar />

      <div className="flex-1 md:ml-64 p-4 md:p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">Integrations</h1>
            <p className="text-sm text-muted mt-1">Connect your favorite apps and AI models</p>
          </div>
          <button className="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-black px-5 py-2.5 rounded-lg flex items-center space-x-2 font-semibold shadow-lg shadow-emerald-400/30 transition-all">
            <Plus className="w-4 h-4" />
            <span>Suggest Integration</span>
          </button>
        </div>

        {/* Available LLMs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-primary">Available LLMs</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div 
                key={integration.name} 
                className="bg-card-dark rounded-xl p-6 border border-white/5 shadow-lg hover:border-emerald-400/20 transition-all group cursor-pointer"
                onClick={() => handleVisitWebsite(integration.url)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 p-1 rounded-lg  flex items-center justify-center group-hover:scale-110 transition-transform">
                      <img 
                        src={integration.icon} 
                        alt={integration.name}
                        className="w-full h-full rounded object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{integration.name}</h4>
                      <p className="text-xs text-muted">{integration.description}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted group-hover:text-emerald-400 transition-colors" />
                </div>
                <button 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-emerald-500/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVisitWebsite(integration.url);
                  }}
                >
                  Visit Website
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Integrations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-primary">Upcoming Integrations</h3>
            <div className="flex gap-2">
              {['all', 'Productivity', 'Storage', 'Communication', 'Automation'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === cat
                      ? 'bg-emerald-400 text-black'
                      : 'bg-card-darker text-sidebar-text hover:bg-card-dark border border-white/5'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => (
              <div key={integration.name} className="bg-card-dark rounded-xl p-6 border border-white/5 hover:border-gray-600 transition-all group shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                      <img 
                        src={integration.icon} 
                        alt={integration.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{integration.name}</h4>
                        {integration.popular && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                        {integration.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted mb-4">{integration.description}</p>
                
                <button className="w-full bg-card-darker hover:bg-gray-600 text-sidebar-text hover:text-white py-2 rounded-lg text-sm transition-all border border-white/5">
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
