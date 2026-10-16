'use client'

/**
 * Copy text to clipboard with proper error handling
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available, using fallback method')
      return await copyToClipboardFallback(text)
    }

    // Try to use the modern clipboard API
    await navigator.clipboard.writeText(text)
    console.log('Successfully copied to clipboard using modern API')
    return true
  } catch (error) {
    console.warn('Modern clipboard API failed:', error.message)
    
    // Check if it's a permissions issue
    if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
      console.warn('Clipboard permission denied, trying fallback method')
    }
    
    // Fallback to legacy method
    return await copyToClipboardFallback(text)
  }
}

/**
 * Fallback clipboard copy method using legacy execCommand
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} - Success status
 */
async function copyToClipboardFallback(text) {
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    textArea.setAttribute('readonly', '')
    document.body.appendChild(textArea)
    
    // Select the text
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, 99999) // For mobile devices
    
    // Copy using legacy method
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    if (successful) {
      console.log('Successfully copied to clipboard using fallback method')
      return true
    } else {
      throw new Error('Legacy copy method failed')
    }
  } catch (error) {
    console.error('All copy methods failed:', error)
    return false
  }
}

/**
 * Read text from clipboard with proper error handling
 * @returns {Promise<string|null>} - Clipboard text or null if failed
 */
export async function readFromClipboard() {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available')
      return null
    }

    // Try to read from clipboard
    const text = await navigator.clipboard.readText()
    console.log('Successfully read from clipboard')
    return text
  } catch (error) {
    console.warn('Failed to read from clipboard:', error.message)
    
    // Check if it's a permissions issue
    if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
      console.warn('Clipboard read permission denied')
    }
    
    return null
  }
}

/**
 * Check if clipboard functionality is available
 * @returns {Promise<boolean>} - Whether clipboard is available
 */
export async function isClipboardAvailable() {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard) {
      console.log('Clipboard API not available, but fallback methods may work')
      return true // Fallback methods might still work
    }

    // Try to check permissions (this might fail in some browsers)
    try {
      const writePermission = await navigator.permissions.query({ name: 'clipboard-write' })
      const readPermission = await navigator.permissions.query({ name: 'clipboard-read' })
      
      const writeAllowed = writePermission.state !== 'denied'
      const readAllowed = readPermission.state !== 'denied'
      
      console.log('Clipboard permissions:', { write: writePermission.state, read: readPermission.state })
      return writeAllowed && readAllowed
    } catch (permissionError) {
      console.warn('Could not check clipboard permissions:', permissionError.message)
      // If we can't check permissions, assume it might work
      return true
    }
  } catch (error) {
    console.warn('Failed to check clipboard availability:', error)
    return false
  }
}

/**
 * Request clipboard permissions explicitly
 * @returns {Promise<boolean>} - Whether permissions were granted
 */
export async function requestClipboardPermissions() {
  try {
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available')
      return false
    }

    // Try to write a small test to trigger permission request
    try {
      await navigator.clipboard.writeText('')
      console.log('Clipboard write permission granted')
      return true
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        console.warn('Clipboard write permission denied by user')
        return false
      }
      throw error
    }
  } catch (error) {
    console.warn('Failed to request clipboard permissions:', error)
    return false
  }
}
