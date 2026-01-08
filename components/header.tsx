"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, Globe, User, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface HeaderProps {
  language: "en" | "zh"
  setLanguage: (lang: "en" | "zh") => void
}

const translations = {
  en: {
    pricing: "Subscribe",
    docs: "Docs",
    examples: "Examples",
    signIn: "Sign In",
    getStarted: "Get Started",
  },
  zh: {
    pricing: "订阅",
    docs: "文档",
    examples: "示例",
    signIn: "登录",
    getStarted: "开始使用",
  },
}

export function Header({ language, setLanguage }: HeaderProps) {
  const t = translations[language]
  const { user, signOut, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
  }

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 30px)' }}>
      <div className="container max-w-[95%] xl:max-w-[1400px] mx-auto flex h-14 sm:h-16 items-center justify-between px-2 sm:px-0">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-accent">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold">CodeGen AI</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <a href="#features" className="hidden md:block text-xs sm:text-sm text-white hover:text-white/80 transition-colors">
              {t.docs}
            </a>
            <a href="#examples" className="hidden md:block text-xs sm:text-sm text-white hover:text-white/80 transition-colors">
              {t.examples}
            </a>
            <Link href="/payment" className="text-xs sm:text-sm text-white hover:text-white/80 transition-colors">
              {t.pricing}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "zh" : "en")}
            className="gap-1.5 h-8 px-2 sm:px-3"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs sm:text-sm">{language === "en" ? "中文" : "English"}</span>
          </Button>

          {loading ? (
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-secondary animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full p-0">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    <AvatarImage src="" alt={user.email || ""} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {getUserInitials(user.email || "")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 sm:w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{user.user_metadata?.full_name || "User"}</p>
                    <p className="w-[160px] sm:w-[200px] truncate text-xs sm:text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer text-sm">
                    <User className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer text-sm">
                    <Settings className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 text-sm"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  <LogOut className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 px-2 sm:px-3" asChild>
                <Link href="/login">{t.signIn}</Link>
              </Button>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-xs sm:text-sm h-8 px-2 sm:px-4" asChild>
                <Link href="/register">{t.getStarted}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
