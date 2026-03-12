"use client";
// src/components/marketplace/AssetCard.tsx
import Image from "next/image";
import { Download, Eye, Play } from "lucide-react";
import type { Asset } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  asset: Asset;
  onClick: () => void;
}

export function AssetCard({ asset, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-[4/3] rounded overflow-hidden cursor-pointer bg-subtle border border-border hover:border-clay/40 transition-all duration-300"
    >
      <Image
        src={asset.preview_url || asset.thumbnail_url}
        alt={asset.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />

      {/* Video badge */}
      {asset.type === "video" && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
          <Play size={12} className="text-white ml-0.5" />
        </div>
      )}

      {/* Editorial badge */}
      {asset.is_editorial && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-clay text-white rounded">
          Editorial
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-xs font-medium text-white line-clamp-1 mb-1.5">{asset.title}</p>
          <div className="flex items-center gap-3 text-white/60">
            <span className="flex items-center gap-1 text-[10px]">
              <Eye size={10} /> {asset.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <Download size={10} /> {asset.downloads.toLocaleString()}
            </span>
            <span className="ml-auto text-xs font-bold text-clay">${asset.price_usd}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
