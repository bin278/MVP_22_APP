"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ConfigCheck {
  name: string
  status: "success" | "error" | "warning"
  message: string
  value?: string
}

export default function DebugAuthPage() {
  const [checks, setChecks] = useState<ConfigCheck[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const configChecks: ConfigCheck[] = []

    // 检查环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const authProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER
    const dbProvider = process.env.DATABASE_PROVIDER

    // Supabase URL
    configChecks.push({
      name: "NEXT_PUBLIC_SUPABASE_URL",
      status: supabaseUrl ? "success" : "error",
      message: supabaseUrl ? "Supabase URL 已配置" : "Supabase URL 未配置",
      value: supabaseUrl || "未设置"
    })

    // Supabase Anon Key
    configChecks.push({
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      status: supabaseAnonKey ? "success" : "error",
      message: supabaseAnonKey ? "Supabase Anon Key 已配置" : "Supabase Anon Key 未配置",
      value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "未设置"
    })

    // Auth Provider
    const isSupabaseAuth = authProvider === 'supabase'
    configChecks.push({
      name: "AUTH_PROVIDER",
      status: isSupabaseAuth ? "success" : "error",
      message: isSupabaseAuth ? "认证提供商设置为 Supabase (支持 Google 登录)" : "认证提供商不是 Supabase (不支持 Google 登录)",
      value: authProvider || "未设置"
    })

    // Database Provider
    configChecks.push({
      name: "DATABASE_PROVIDER",
      status: dbProvider === 'supabase' ? "success" : "warning",
      message: dbProvider === 'supabase' ? "数据库提供商设置为 Supabase" : "数据库提供商可能不是 Supabase",
      value: dbProvider || "未设置"
    })

    // 检查是否在客户端
    configChecks.push({
      name: "运行环境",
      status: typeof window !== 'undefined' ? "success" : "warning",
      message: typeof window !== 'undefined' ? "客户端环境" : "服务端环境",
      value: typeof window !== 'undefined' ? window.location.hostname : "N/A"
    })

    setChecks(configChecks)
    setLoading(false)
  }, [])

  const getStatusIcon = (status: ConfigCheck["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const allSuccess = checks.every(c => c.status === "success")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Google 登录配置诊断</h1>
          <p className="text-muted-foreground">
            检查 Google 登录所需的环境变量和配置
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">正在检查配置...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className={allSuccess ? "border-green-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {allSuccess ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  {allSuccess ? "所有配置检查通过" : "配置检查失败"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checks.map((check, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{check.name}</div>
                          <div className="text-sm text-muted-foreground">{check.message}</div>
                          {check.value && (
                            <div className="mt-2 text-xs font-mono bg-muted px-2 py-1 rounded">
                              {check.value}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!allSuccess && (
              <Card>
                <CardHeader>
                  <CardTitle>配置步骤</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">1. 配置 Vercel 环境变量</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      在 Vercel 项目设置中添加以下环境变量：
                    </p>
                    <div className="bg-muted p-3 rounded text-xs font-mono space-y-1">
                      <div>AUTH_PROVIDER=supabase</div>
                      <div>NEXT_PUBLIC_AUTH_PROVIDER=supabase</div>
                      <div>DATABASE_PROVIDER=supabase</div>
                      <div>NEXT_PUBLIC_SUPABASE_URL=https://ctiydmjqhxmtjwmrilip.supabase.co</div>
                      <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key</div>
                      <div>SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">2. 在 Supabase 控制台启用 Google Provider</h3>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>访问 https://supabase.com/dashboard</li>
                      <li>选择项目: ctiydmjqhxmtjwmrilip</li>
                      <li>导航到 Authentication → Providers</li>
                      <li>找到 Google provider 并启用</li>
                      <li>在 Authentication → URL Configuration 添加重定向 URL</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">3. 配置重定向 URL</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      在 Supabase 的 Authentication → URL Configuration 中添加：
                    </p>
                    <div className="bg-muted p-3 rounded text-xs font-mono space-y-1">
                      <div>http://localhost:3000/google-callback</div>
                      <div>https://你的vercel域名.vercel.app/google-callback</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
