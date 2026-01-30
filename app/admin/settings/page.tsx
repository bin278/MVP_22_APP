"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/actions/admin-auth";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);

    if (result.success) {
      setMessage({ type: "success", text: "密码修改成功" });
      (e.target as HTMLFormElement).reset();
    } else {
      setMessage({ type: "error", text: result.error || "密码修改失败" });
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">管理员设置</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-1">密码长度至少为8个字符</p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? "修改中..." : "修改密码"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
