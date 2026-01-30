"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Megaphone,
  LinkIcon,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { adminLogout } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  username: string;
}

const navItems = [
  { href: "/admin/stats", label: "统计", icon: BarChart3 },
  { href: "/admin/ads", label: "广告", icon: Megaphone },
  { href: "/admin/social-links", label: "链接", icon: LinkIcon },
  { href: "/admin/releases", label: "版本", icon: Package },
  { href: "/admin/orders", label: "订单", icon: ShoppingCart },
  { href: "/admin/settings", label: "设置", icon: Settings },
];

export default function AdminSidebar({ username }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await adminLogout();
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">管理后台</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-50
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-xl font-bold">管理后台</h1>
            <p className="text-sm text-slate-400 mt-1">{username}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-700">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LogOut size={20} className="mr-3" />
              退出登录
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg
                  ${isActive ? "text-blue-600" : "text-slate-600"}
                `}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
