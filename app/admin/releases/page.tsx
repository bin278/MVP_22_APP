"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getReleases, deleteRelease, type Release } from "@/actions/admin-releases";

export default function AdminReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReleases();
  }, []);

  async function loadReleases() {
    setLoading(true);
    try {
      const data = await getReleases();
      setReleases(data);
    } catch (error) {
      console.error("Failed to load releases:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这个版本吗？")) return;

    const result = await deleteRelease(id);
    if (result.success) {
      loadReleases();
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
        <h1 className="text-3xl font-bold">版本管理</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {releases.map((release) => (
          <Card key={release.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{release.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    v{release.version}
                  </p>
                </div>
                <Badge
                  variant={
                    release.status === "published"
                      ? "default"
                      : release.status === "draft"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {release.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {release.description}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">平台:</span>
                  <span>{release.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">发布日期:</span>
                  <span>
                    {new Date(release.release_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(release.download_url, "_blank")}
                  className="flex-1"
                >
                  下载
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(release.id)}
                >
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {releases.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">暂无版本</div>
      )}
    </div>
  );
}
