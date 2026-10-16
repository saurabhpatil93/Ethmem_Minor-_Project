'use client'

import { useState, useEffect } from 'react'
import extensionBridge from '../../lib/extensionBridge'
import { Database, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

export default function StoragePage() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [extensionStatus, setExtensionStatus] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    importance: 'medium'
  })

  // Load data from extension
  useEffect(() => {
    loadExtensionData()
  }, [])

  const loadExtensionData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check extension status
      const status = await extensionBridge.getExtensionStatus()
      setExtensionStatus(status)
      
      if (status.isAvailable) {
        // Load memories from extension
        const extensionMemories = await extensionBridge.getMemories()
        setMemories(extensionMemories)
      } else {
        setError('Extension not available. Please install and enable the EthMem extension.')
      }
    } catch (err) {
      console.error('Error loading extension data:', err)
      setError('Failed to load data from extension')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    setError(null)

    try {
      // Create memory data in extension format
      const memoryData = {
        id: `mem-${Date.now()}`,
        timestamp: Date.now(),
        category: formData.category,
        entity: formData.title,
        description: formData.description,
        source: 'Manual Entry',
        status: 'local',
        metadata: {
          confidence: 1.0,
          importance: formData.importance,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          modelUsed: 'manual'
        }
      }

      console.log('[StoragePage] Creating memory:', memoryData)
      
      // For now, we'll just add it to local state
      // In a real implementation, this would communicate with the extension
      setMemories(prev => [memoryData, ...prev])
      setSuccessMessage('Memory created successfully!')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: '',
        importance: 'medium'
      })
      setShowForm(false)
      
    } catch (error) {
      console.error('[StoragePage] Creation failed:', error)
      setError('Failed to create memory')
    }
  }

  const handleDelete = async (memoryId) => {
    if (!confirm('Are you sure you want to delete this memory?')) {
      return
    }

    try {
      const success = await extensionBridge.deleteMemory(memoryId)
      if (success) {
        setMemories(memories.filter(m => m.id !== memoryId))
        setSuccessMessage('Memory deleted successfully!')
      } else {
        setError('Failed to delete memory')
      }
    } catch (error) {
      console.error('[StoragePage] Delete failed:', error)
      setError('Failed to delete memory')
    }
  }

  const handleRefresh = () => {
    loadExtensionData()
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }



  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">Memory Storage</h1>
            {extensionStatus && (
              <div className="flex items-center space-x-2">
                {extensionStatus.isAvailable ? (
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">Extension Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Extension Disconnected</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-300">
            Store and manage your memories. Total memories: {memories.length}
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500/20 rounded-md p-4">
            <p className="text-green-400">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/20 rounded-md p-4">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Extension Status Info */}
        {extensionStatus && !extensionStatus.isAvailable && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-400 mb-1">Extension Required</h4>
                <p className="text-sm text-yellow-300">
                  Please install and enable the EthMem browser extension to manage your memories.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Memory Button */}
        <div className="mb-6 flex items-center space-x-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Cancel' : 'Add New Memory'}</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Add Memory Form */}
        {showForm && (
          <div className="mb-8 bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Memory</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter memory title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe your memory"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select category</option>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="family">Family</option>
                    <option value="hobby">Hobby</option>
                    <option value="travel">Travel</option>
                    <option value="education">Education</option>
                    <option value="health">Health</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Importance
                  </label>
                  <select
                    name="importance"
                    value={formData.importance}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Memory'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Memories List */}
        <div className="bg-gray-800 rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Your Memories</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="ml-2 text-gray-400">Loading memories...</span>
              </div>
            ) : !extensionStatus?.isAvailable ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">Extension Required</h3>
                <p className="text-gray-500">
                  Install the EthMem browser extension to manage your memories
                </p>
              </div>
            ) : memories.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No memories stored yet. Add your first memory above!
              </p>
            ) : (
              <div className="space-y-4">
                {memories.map((memory) => (
                  <div key={memory.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-white">
                        {memory.entity || 'Untitled Memory'}
                      </h3>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          memory.metadata?.importance === 'high' ? 'bg-red-900/20 text-red-400' :
                          memory.metadata?.importance === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                          'bg-green-900/20 text-green-400'
                        }`}>
                          {memory.metadata?.importance || 'medium'}
                        </span>
                        <button
                          onClick={() => handleDelete(memory.id)}
                          className="text-red-400 hover:text-red-300 text-sm flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-2">
                      {memory.description || 'No description'}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {memory.category && (
                        <span className="px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded">
                          {memory.category}
                        </span>
                      )}
                      {memory.metadata?.tags && memory.metadata.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      <p>Memory ID: {memory.id}</p>
                      <p>Status: {memory.status}</p>
                      <p>Created: {formatDate(memory.timestamp)}</p>
                      {memory.metadata?.confidence && (
                        <p>Confidence: {Math.round(memory.metadata.confidence * 100)}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}