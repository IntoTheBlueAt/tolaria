import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { isTauri } from "../mock-tauri";

interface PdfViewerProps {
  path: string;
}

export function PdfViewer({ path }: PdfViewerProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isTauri()) {
      setSrc(convertFileSrc(path));
    }
  }, [path]);

  if (!src) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        PDF preview not available
      </div>
    );
  }

  return (
    <iframe
      src={src}
      className="flex-1 w-full border-0"
      style={{ minHeight: 0 }}
      title="PDF preview"
    />
  );
}
