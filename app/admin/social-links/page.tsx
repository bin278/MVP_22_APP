"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSocialLinks,
  deleteSocialLink,
  toggleSocialLinkVisibility,
  createSocialLink,
  updateSocialLink,
  type SocialLink,
} from "@/actions/admin-social-links";

export default function AdminSocialLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    setLoading(true);
    try {
      const data = await getSocialLinks();
      setLinks(data);
    } catch (error) {
      console.error("Failed to load social links:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这个链接吗？")) return;

    const result = await deleteSocialLink(id);
    if (result.success) {
      loadLinks();
    } else {
      alert(result.error);
    }
  }

  async function handleToggleVisibility(id: string, currentVisible: boolean) {
    const result = await toggleSocialLinkVisibility(id, !currentVisible);
    if (result.success) {
      loadLinks();
    } else {
      alert(result.error);
    }
  }

  function openCreateDialog() {
    setEditingLink(null);
    setDialogOpen(true);
  }

  function openEditDialog(link: SocialLink) {
    setEditingLink(link);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = editingLink
      ? await updateSocialLink(editingLink.id, formData)
      : await createSocialLink(formData);

    if (result.success) {
      setDialogOpen(false);
      loadLinks();
    } else {
      alert(result.error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">社交链接管理</h1>
        <Button onClick={openCreateDialog}>添加链接</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Card key={link.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{link.platform}</CardTitle>
                <Badge variant={link.visible ? "default" : "secondary"}>
                  {link.visible ? "显示" : "隐藏"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate max-w-[200px]"
                  >
                    {link.url}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">图标:</span>
                  <span>{link.icon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">排序:</span>
                  <span>{link.order}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditDialog(link)}>
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleVisibility(link.id, link.visible)}
                >
                  {link.visible ? "隐藏" : "显示"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(link.id)}
                >
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {links.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">暂无链接</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? "编辑链接" : "添加链接"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="platform">平台名称</Label>
              <Input id="platform" name="platform" defaultValue={editingLink?.platform} required />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" type="url" defaultValue={editingLink?.url} required />
            </div>
            <div>
              <Label htmlFor="icon">图标</Label>
              <Input id="icon" name="icon" defaultValue={editingLink?.icon} required />
            </div>
            <div>
              <Label htmlFor="order">排序</Label>
              <Input id="order" name="order" type="number" defaultValue={editingLink?.order ?? 0} required />
            </div>
            <div className="flex items-center gap-2">
              <input id="visible" name="visible" type="checkbox" defaultChecked={editingLink?.visible ?? true} value="true" />
              <Label htmlFor="visible">显示</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button type="submit">{editingLink ? "更新" : "创建"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
