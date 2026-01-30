"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAds, deleteAd, toggleAdStatus, createAd, updateAd, type Ad } from "@/actions/admin-ads";

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  useEffect(() => {
    loadAds();
  }, [filter]);

  async function loadAds() {
    setLoading(true);
    try {
      const data = await getAds("all", filter === "all" ? undefined : filter);
      setAds(data);
    } catch (error) {
      console.error("Failed to load ads:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这个广告吗？")) return;

    const result = await deleteAd(id);
    if (result.success) {
      loadAds();
    } else {
      alert(result.error);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const result = await toggleAdStatus(id, newStatus);
    if (result.success) {
      loadAds();
    } else {
      alert(result.error);
    }
  }

  function openCreateDialog() {
    setEditingAd(null);
    setDialogOpen(true);
  }

  function openEditDialog(ad: Ad) {
    setEditingAd(ad);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = editingAd
      ? await updateAd(editingAd.id, formData)
      : await createAd(formData);

    if (result.success) {
      setDialogOpen(false);
      loadAds();
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
        <h1 className="text-3xl font-bold">广告管理</h1>
        <div className="flex gap-2">
          <Button onClick={openCreateDialog}>添加广告</Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            全部
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => setFilter("active")}
          >
            启用
          </Button>
          <Button
            variant={filter === "inactive" ? "default" : "outline"}
            onClick={() => setFilter("inactive")}
          >
            禁用
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <Card key={ad.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{ad.title}</CardTitle>
                <Badge variant={ad.status === "active" ? "default" : "secondary"}>
                  {ad.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ad.media_url && (
                <div className="aspect-video bg-slate-100 rounded overflow-hidden">
                  {ad.media_type === "image" ? (
                    <img
                      src={ad.media_url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={ad.media_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">位置:</span>
                  <span>{ad.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">区域:</span>
                  <span>{ad.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">优先级:</span>
                  <span>{ad.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">展示/点击:</span>
                  <span>
                    {ad.impressions} / {ad.clicks}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditDialog(ad)}>
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(ad.id, ad.status)}
                >
                  {ad.status === "active" ? "禁用" : "启用"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(ad.id)}
                >
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ads.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">暂无广告</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? "编辑广告" : "添加广告"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">标题</Label>
              <Input id="title" name="title" defaultValue={editingAd?.title} required />
            </div>
            <div>
              <Label htmlFor="description">描述</Label>
              <Input id="description" name="description" defaultValue={editingAd?.description || ""} />
            </div>
            <div>
              <Label htmlFor="media_type">媒体类型</Label>
              <Select name="media_type" defaultValue={editingAd?.media_type || "image"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">图片</SelectItem>
                  <SelectItem value="video">视频</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="media_url">媒体URL</Label>
              <Input id="media_url" name="media_url" type="url" defaultValue={editingAd?.media_url} required />
            </div>
            <div>
              <Label htmlFor="thumbnail_url">缩略图URL</Label>
              <Input id="thumbnail_url" name="thumbnail_url" type="url" defaultValue={editingAd?.thumbnail_url || ""} />
            </div>
            <div>
              <Label htmlFor="link_url">链接URL</Label>
              <Input id="link_url" name="link_url" type="url" defaultValue={editingAd?.link_url || ""} />
            </div>
            <div>
              <Label htmlFor="link_type">链接类型</Label>
              <Select name="link_type" defaultValue={editingAd?.link_type || "external"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">外部</SelectItem>
                  <SelectItem value="internal">内部</SelectItem>
                  <SelectItem value="download">下载</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="position">位置</Label>
              <Select name="position" defaultValue={editingAd?.position || "left"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">左侧</SelectItem>
                  <SelectItem value="right">右侧</SelectItem>
                  <SelectItem value="top">顶部</SelectItem>
                  <SelectItem value="bottom">底部</SelectItem>
                  <SelectItem value="generate">生成界面</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="platform">平台</Label>
              <Input id="platform" name="platform" defaultValue={editingAd?.platform || "web"} required />
            </div>
            <div>
              <Label htmlFor="region">区域</Label>
              <Select name="region" defaultValue={editingAd?.region || "all"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">全球</SelectItem>
                  <SelectItem value="cn">中国</SelectItem>
                  <SelectItem value="all">全部</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">状态</Label>
              <Select name="status" defaultValue={editingAd?.status || "inactive"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">禁用</SelectItem>
                  <SelectItem value="scheduled">计划</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">优先级</Label>
              <Input id="priority" name="priority" type="number" defaultValue={editingAd?.priority ?? 0} required />
            </div>
            <div>
              <Label htmlFor="start_at">开始时间</Label>
              <Input id="start_at" name="start_at" type="datetime-local" defaultValue={editingAd?.start_at || ""} />
            </div>
            <div>
              <Label htmlFor="end_at">结束时间</Label>
              <Input id="end_at" name="end_at" type="datetime-local" defaultValue={editingAd?.end_at || ""} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button type="submit">{editingAd ? "更新" : "创建"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
