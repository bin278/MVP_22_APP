import { NextRequest, NextResponse } from 'next/server'
import { add, query, update } from '@/lib/database/cloudbase'

/**
 * Handle GitHub OAuth callback
 * GET /api/github/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_error=${encodeURIComponent(error)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_error=missing_parameters`
    )
  }

  try {
    // Decode state to get userId
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const userId = stateData.userId

    if (!userId) {
      throw new Error('Invalid state parameter')
    }

    // Exchange code for access token
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth not configured')
    }

    // Helper function to fetch with timeout and retry
    async function fetchWithRetry(
      url: string,
      options: RequestInit,
      retries = 3,
      timeout = 10000
    ): Promise<Response> {
      for (let i = 0; i < retries; i++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), timeout)

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          })

          clearTimeout(timeoutId)
          return response
        } catch (error: any) {
          if (i === retries - 1) {
            throw error
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
          console.log(`Retrying GitHub API call (attempt ${i + 2}/${retries})...`)
        }
      }
      throw new Error('Failed after retries')
    }

    // Exchange code for access token with retry
    const tokenResponse = await fetchWithRetry(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
      3, // 3 retries
      15000 // 15 second timeout
    )

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('GitHub token exchange failed:', errorText)
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('No access token received')
    }

    // Get GitHub user info with retry
    const userResponse = await fetchWithRetry(
      'https://api.github.com/user',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      },
      3, // 3 retries
      15000 // 15 second timeout
    )

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('GitHub user fetch failed:', errorText)
      throw new Error(`Failed to fetch GitHub user info: ${userResponse.status}`)
    }

    const githubUser = await userResponse.json()

    // Store GitHub token in CloudBase
    try {
      // 检查是否已存在GitHub token记录
      const existingToken = await query('user_github_tokens', {
        where: { user_id: userId },
        limit: 1
      })

      if (existingToken.data && existingToken.data.length > 0) {
        // 更新现有记录
        await update('user_github_tokens', existingToken.data[0]._id, {
          github_token: accessToken,
          github_username: githubUser.login,
          updated_at: new Date().toISOString(),
        })
        console.log('Updated existing GitHub token for user:', userId)
      } else {
        // 创建新记录
        await add('user_github_tokens', {
          user_id: userId,
          github_token: accessToken,
          github_username: githubUser.login,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        console.log('Created new GitHub token for user:', userId)
      }
    } catch (dbError: any) {
      console.error('Error storing GitHub token in CloudBase:', dbError)
      // 如果集合不存在或其他错误，重定向并显示警告
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_connected=true&github_username=${githubUser.login}&github_warning=db_error`
      )
    }

    // Redirect back to generate page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_connected=true&github_username=${githubUser.login}`
    )
  } catch (error: any) {
    console.error('Error handling GitHub callback:', error)
    
    // 提供更友好的错误消息
    let errorMessage = 'GitHub连接失败'
    if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.name === 'AbortError') {
      errorMessage = 'GitHub连接超时，请稍后重试'
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'GitHub连接超时，请稍后重试'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_error=${encodeURIComponent(errorMessage)}`
    )
  }
}

