"use client";

import { useEffect, useRef, useState } from "react";
import { getAdsByPosition, trackAdImpression, trackAdClick, type Ad } from "@/services/ads-client";

interface AdBannerProps {
  position: "left" | "right" | "top" | "bottom";
  region?: string;
  platform?: string;
  limit?: number;
}

export function AdBanner({ position, region = "all", platform = "web", limit = 1 }: AdBannerProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const trackedImpressions = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadAds();
  }, [position, region, platform, limit]);

  async function loadAds() {
    setLoading(true);
    try {
      const data = await getAdsByPosition(position, { region, platform, limit });
      setAds(data);
    } catch (error) {
      console.error("Failed to load ads:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ads.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const adId = entry.target.getAttribute("data-ad-id");
            if (adId && !trackedImpressions.current.has(adId)) {
              trackedImpressions.current.add(adId);
              trackAdImpression(adId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [ads]);

  function handleAdClick(ad: Ad) {
    trackAdClick(ad.id);
    if (ad.link_url) {
      if (ad.link_type === "external") {
        window.open(ad.link_url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = ad.link_url;
      }
    }
  }

  if (loading || ads.length === 0) return null;

  return (
    <div className={`w-full flex justify-center py-4 ${position === 'top' ? 'border-b' : 'border-t'} border-border/40`}>
      {ads.map((ad) => (
        <div
          key={ad.id}
          data-ad-id={ad.id}
          ref={(el) => el && observerRef.current?.observe(el)}
          onClick={() => handleAdClick(ad)}
          className="cursor-pointer max-w-4xl w-full hover:opacity-80 transition-opacity"
        >
          {ad.media_type === "image" ? (
            <img src={ad.media_url} alt={ad.title} className="w-full h-auto rounded-lg" />
          ) : (
            <video src={ad.media_url} className="w-full h-auto rounded-lg" controls />
          )}
        </div>
      ))}
    </div>
  );
}
