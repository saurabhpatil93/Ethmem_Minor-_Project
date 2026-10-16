import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { data, type = 'json' } = await request.json()
    
    if (!process.env.NEXT_PUBLIC_PINATA_API_KEY || !process.env.NEXT_PUBLIC_PINATA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Pinata API keys not configured' },
        { status: 500 }
      )
    }

    let result
    
    if (type === 'json') {
      // Upload JSON data
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `Memory-${Date.now()}`,
            keyvalues: {
              timestamp: new Date().toISOString(),
              type: 'memory-data'
            }
          }
        })
      })
      
      result = await response.json()
    } else if (type === 'file') {
      // Upload file data
      const formData = new FormData()
      formData.append('file', new Blob([data.content], { type: data.type }), data.name)
      formData.append('pinataMetadata', JSON.stringify({
        name: data.name,
        keyvalues: {
          originalName: data.name,
          fileType: data.type,
          uploadTime: new Date().toISOString()
        }
      }))
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
        },
        body: formData
      })
      
      result = await response.json()
    }

    if (!result.IpfsHash) {
      throw new Error('Failed to upload to IPFS')
    }

    return NextResponse.json({
      success: true,
      hash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    })
    
  } catch (error) {
    console.error('IPFS upload error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
