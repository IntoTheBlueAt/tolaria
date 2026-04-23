import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { isTauri } from "../mock-tauri";

interface ImageViewerProps {
  path: string;
}

export function ImageViewer({ path }: ImageViewerProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isTauri()) {
      setSrc(convertFileSrc(path));
    }
  }, [path]);

  if (!src) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Image preview not available
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto p-4">
      <img src={src} className="max-w-full max-h-full object-contain" alt="" />
    </div>
  );
}
