import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'

/**
 * Initiate GitHub OAuth flow
 * GET /api/github/auth
 */
export async function GET(request: NextRequest) {
  try {
    // 使用CloudBase认证
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user

    // Get GitHub OAuth configuration
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!clientId || !clientSecret) {
      console.error('GitHub OAuth not configured')
      return NextResponse.json(
        {
          error: 'GitHub OAuth not configured. Please contact administrator to configure GitHub OAuth settings.'
        },
        { status: 500 }
      )
    }

    // Create state parameter with user ID
    const stateData = {
      userId: user.uid || user.id, // CloudBase用户使用uid
      timestamp: Date.now()
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64')

    // Build GitHub OAuth URL
    const scopes = ['repo', 'user:email'] // Request access to repositories and email
    const authUrl = new URL('https://github.com/login/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', `${appUrl}/api/github/callback`)
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('allow_signup', 'true')

    console.log('Generated GitHub OAuth URL for user:', user.id)

    return NextResponse.json({
      authUrl: authUrl.toString(),
      message: 'Redirect user to this URL for GitHub OAuth'
    })

  } catch (error: any) {
    console.error('Error initiating GitHub OAuth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}