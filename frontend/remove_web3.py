import os

base_dir = '/home/naman/Desktop/CODE/EthMem-main/frontend'

# 1. Update DashboardHeader.jsx
header_path = os.path.join(base_dir, 'app/dashboard/components/DashboardHeader.jsx')
with open(header_path, 'r') as f:
    content = f.read()
content = content.replace("import { useWallet } from '../../../hooks/useWallet'\n", "")
content = content.replace("  const { formattedAddress, isConnected } = useWallet()\n", "")
content = content.replace("Welcome back, {isConnected ? formattedAddress : '0x4a...b3'}", "Welcome back, User")
content = content.replace('''        <div className="px-4 py-2 bg-emerald-400 text-black rounded-full font-semibold text-sm shadow-lg shadow-emerald-400/20 flex items-center gap-2">
          <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
          Connected
        </div>''', "")
with open(header_path, 'w') as f:
    f.write(content)


# 2. Update Sidebar.jsx
sidebar_path = os.path.join(base_dir, 'app/dashboard/components/Sidebar.jsx')
with open(sidebar_path, 'r') as f:
    lines = f.readlines()

new_sidebar = []
skip_mode = False
for line in lines:
    if "import { useWallet } from '../../../hooks/useWallet'" in line:
        continue
    if "const { " in line and "isConnected" in lines[lines.index(line)+1]:
        skip_mode = True
        continue
    if skip_mode and "} = useWallet()" in line:
        skip_mode = False
        continue
    if skip_mode:
        continue
    if "const handleConnect" in line:
        skip_mode = True
        continue
    if skip_mode and "const handleCopyAddress" in line:
        skip_mode = False
        # Do not include handleConnect, but handleCopyAddress is also skipped later
    if skip_mode:
        continue
    if "const handleCopyAddress" in line:
        skip_mode = True
        continue
    if skip_mode and "const SidebarContent" in line:
        skip_mode = False

    if "        {/* Connection Status */}" in line:
        skip_mode = True
        continue
    if skip_mode and "        </div>" in line:
        skip_mode = False
        continue
    if skip_mode:
        continue

    new_sidebar.append(line)

with open(sidebar_path, 'w') as f:
    f.writelines(new_sidebar)


# 3. Update storage/page.jsx
storage_path = os.path.join(base_dir, 'app/storage/page.jsx')
with open(storage_path, 'r') as f:
    content = f.read()

content = content.replace("import { useWallet } from '../../hooks/useWallet'\n", "")
content = content.replace("  const { isConnected, connectWallet, connectors } = useWallet()\n", "")

not_connected_block = """  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-300 mb-6">
              Connect your wallet to store and manage your memories.
            </p>
            <div className="space-y-3">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connectWallet(connector)}
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Connect {connector.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }"""
content = content.replace(not_connected_block, "")
with open(storage_path, 'w') as f:
    f.write(content)


# 4. Rewrite UnifiedDataViewer.jsx
viewer_path = os.path.join(base_dir, 'app/dashboard/components/UnifiedDataViewer.jsx')

new_viewer = """'use client'

import { useState, useEffect } from 'react'
import { 
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react'
import extensionBridge from '../../../lib/extensionBridge'

export default function UnifiedDataViewer({ onMemoriesUpdate }) {
  const [extensionMemories, setExtensionMemories] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ethmem_extension_memories')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved memories:', e)
        }
      }
    }
    return []
  })
  const [loading, setLoading] = useState(true)
  const [extensionStatus, setExtensionStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadExtensionData()
  }, [])

  useEffect(() => {
    if (extensionMemories.length > 0) {
      try {
        localStorage.setItem('ethmem_extension_memories', JSON.stringify(extensionMemories))
      } catch (e) {
        console.error('Failed to save memories to localStorage:', e)
      }
    }
  }, [extensionMemories])

  const loadExtensionData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const status = await extensionBridge.getExtensionStatus()
      setExtensionStatus(status)
      
      if (status.isAvailable) {
        const freshExtensionMemories = await extensionBridge.getMemories()
        
        if (freshExtensionMemories && freshExtensionMemories.length > 0) {
          setExtensionMemories(freshExtensionMemories)
        } else {
          setExtensionMemories([])
        }
        
        if (onMemoriesUpdate) {
          onMemoriesUpdate()
        }
      } else {
        if (extensionBridge.isContextInvalidated()) {
          setError('Extension disconnected. Please refresh the page to reconnect.')
        } else {
          setError('Extension not available. Please install and enable the EthMem extension.')
        }
      }
    } catch (err) {
      console.error('Error loading extension data:', err)
      setError('Failed to load data from extension')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const hasExtensionData = extensionStatus?.isAvailable && extensionMemories.length > 0

  return (
    <div className="bg-card-dark rounded-2xl p-6 shadow-2xl border border-white/10 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative p-3 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl ring-1 ring-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-blue-400/10 rounded-2xl blur-xl"></div>
            <Database className="relative w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Memory Data</h3>
            <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
              {hasExtensionData ? (
                <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Extension Data</>
              ) : (
                <><AlertCircle className="w-3.5 h-3.5 text-gray-500" /> No data available</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadExtensionData}
            disabled={loading}
            className="group relative p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-50 border border-white/5 hover:border-white/20"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} group-hover:scale-110 transition-transform`} />
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Extension Status */}
        <div className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl transition-all ${hasExtensionData ? 'bg-emerald-500/20 ring-1 ring-emerald-500/30' : 'bg-gray-500/20'}`}>
                <Database className={`w-5 h-5 ${hasExtensionData ? 'text-emerald-400' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Local Extension</p>
                <p className="text-base font-bold text-white">
                  {hasExtensionData ? `${extensionMemories.length}` : '0'}
                </p>
              </div>
            </div>
            {hasExtensionData && (
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-500/30 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-red-300 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Unified Memories Section */}
      {extensionMemories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-white flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <span>All Memories</span>
              <span className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-white text-xs px-3 py-1.5 rounded-full font-semibold border border-white/10">
                {extensionMemories.length}
              </span>
            </h4>
          </div>

          <div className="space-y-3">
            {extensionMemories.sort((a,b) => b.timestamp - a.timestamp).map(u => (
              <div key={u.id} className="group bg-gradient-to-br from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/5 rounded-2xl p-4 flex items-start justify-between border border-white/5 hover:border-white/20 transition-all duration-300 shadow-sm hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h5 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{u.entity || 'Untitled Memory'}</h5>
                      {u.category && (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-300 font-medium border border-emerald-500/20">{u.category}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed mb-2">{u.description || 'No description'}</p>
                  </div>
                </div>
                <div className="text-right text-[10px] text-gray-400 ml-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />
                    <span>{u.timestamp ? formatDate(u.timestamp) : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!hasExtensionData && !loading && (
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
            <div className="relative p-6 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-full border border-white/10">
              <Database className="w-14 h-14 text-gray-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Memory Data</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            {!extensionStatus?.isAvailable 
              ? 'Install the EthMem extension to start collecting memories'
              : 'Start chatting to create memories'
            }
          </p>
        </div>
      )}
    </div>
  )
}
"""
with open(viewer_path, 'w') as f:
    f.write(new_viewer)

print("Updated 4 files")
