import { NextResponse } from 'next/server'

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_PINATA_API_KEY || !process.env.NEXT_PUBLIC_PINATA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Pinata API keys not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.pinata.cloud/data/pinList', {
      method: 'GET',
      headers: {
        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
        'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
      }
    })

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      items: result.rows || []
    })
    
  } catch (error) {
    console.error('Get pins error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { hash } = await request.json()
    
    if (!process.env.NEXT_PUBLIC_PINATA_API_KEY || !process.env.NEXT_PUBLIC_PINATA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Pinata API keys not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
      method: 'DELETE',
      headers: {
        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
        'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
      }
    })

    if (!response.ok) {
      throw new Error('Failed to unpin from IPFS')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unpinned from IPFS'
    })
    
  } catch (error) {
    console.error('Unpin error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
