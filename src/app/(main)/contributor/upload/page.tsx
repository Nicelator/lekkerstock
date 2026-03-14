"use client";
// src/app/(main)/contributor/upload/page.tsx
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Film, Palette, Box } from "lucide-react";
import { toast } from "sonner";
import { cn, formatBytes } from "@/lib/utils";
import { analytics } from "@/lib/posthog";

type AssetType = "photo" | "video" | "illustration" | "3d";

interface UploadFile {
  file: File;
  preview: string;
  title: string;
  description: string;
  tags: string;
  type: AssetType;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
}

const TYPE_OPTIONS = [
  { value: "photo" as AssetType, label: "Photo", icon: ImageIcon },
  { value: "video" as AssetType, label: "Video", icon: Film },
  { value: "illustration" as AssetType, label: "Illustration", icon: Palette },
  { value: "3d" as AssetType, label: "3D Asset", icon: Box },
];

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadFile[] = accepted.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      description: "",
      tags: "",
      type: file.type.startsWith("video/") ? "video" : "photo",
      status: "idle",
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".tiff"],
      "video/*": [".mp4", ".mov", ".avi"],
    },
    maxSize: 500 * 1024 * 1024,
    multiple: true,
  });

  const updateFile = (index: number, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadAll = async () => {
    const pending = files.filter(f => f.status === "idle");
    if (pending.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status !== "idle") continue;

      updateFile(i, { status: "uploading" });

      try {
        const formData = new FormData();
        formData.append("file", f.file);
        formData.append("metadata", JSON.stringify({
          title: f.title || f.file.name,
          description: f.description,
          tags: f.tags.split(",").map(t => t.trim()).filter(Boolean),
          type: f.type,
        }));

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        updateFile(i, { status: "done" });
        analytics.assetUploaded(f.type);
        successCount++;
      } catch (err: any) {
        updateFile(i, { status: "error", error: err.message });
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} asset${successCount > 1 ? "s" : ""} uploaded! Under review.`);
      setTimeout(() => router.push("/contributor/studio"), 2000);
    }
  };

  const pendingCount = files.filter(f => f.status === "idle").length;

  return (
    <div className="min-h-screen bg-bg max-w-5xl mx-auto px-4 sm:px-6 py-10" style={{ paddingTop: "96px" }}>
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold text-cream mb-2">Upload Content</h1>
        <p className="text-muted text-sm">Photos, videos, illustrations and 3D assets. All files are reviewed before going live.</p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all mb-8",
          isDragActive ? "border-clay bg-clay/8 scale-[1.01]" : "border-border hover:border-clay/50 hover:bg-subtle"
        )}
      >
        <input {...getInputProps()} />
        <Upload size={36} className={cn("mx-auto mb-4", isDragActive ? "text-clay" : "text-muted")} />
        <p className="text-base font-semibold text-cream mb-1">
          {isDragActive ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-muted mb-3">or click to browse</p>
        <p className="text-xs text-muted/50">JPG, PNG, WebP, TIFF, MP4, MOV · Max 500MB per file</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-4 mb-8">
          {files.map((f, i) => (
            <div key={i} className={cn(
              "card p-4 transition-all",
              f.status === "done" && "border-green-500/30",
              f.status === "error" && "border-red-500/30",
              f.status === "uploading" && "border-clay/30",
            )}>
              <div className="flex gap-4">
                {/* Preview */}
                <div className="relative w-20 h-14 rounded overflow-hidden shrink-0 bg-black">
                  {f.type === "video" ? (
                    <div className="w-full h-full flex items-center justify-center bg-subtle">
                      <Film size={20} className="text-muted" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                  )}

                  {/* Status overlay */}
                  {f.status === "done" && (
                    <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                  )}
                  {f.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Title *</label>
                    <input
                      value={f.title}
                      onChange={e => updateFile(i, { title: e.target.value })}
                      disabled={f.status !== "idle"}
                      className="input text-sm py-2"
                      placeholder="Give your asset a title"
                    />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <div className="flex gap-1">
                      {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          disabled={f.status !== "idle"}
                          onClick={() => updateFile(i, { type: value })}
                          className={cn(
                            "flex-1 py-2 rounded text-[10px] font-semibold uppercase tracking-wide transition-colors",
                            f.type === value ? "bg-clay text-white" : "bg-subtle text-muted hover:text-cream"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Tags (comma separated)</label>
                    <input
                      value={f.tags}
                      onChange={e => updateFile(i, { tags: e.target.value })}
                      disabled={f.status !== "idle"}
                      className="input text-sm py-2"
                      placeholder="Lagos, Nigeria, street, urban"
                    />
                  </div>
                  <div>
                    <label className="label">Description (optional)</label>
                    <input
                      value={f.description}
                      onChange={e => updateFile(i, { description: e.target.value })}
                      disabled={f.status !== "idle"}
                      className="input text-sm py-2"
                      placeholder="Brief description..."
                    />
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFile(i)}
                  disabled={f.status === "uploading"}
                  className="text-muted hover:text-red-400 transition-colors self-start shrink-0 p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* File meta + error */}
              <div className="flex items-center justify-between mt-3 pl-24">
                <span className="text-[10px] text-muted">{f.file.name} · {formatBytes(f.file.size)}</span>
                {f.status === "error" && (
                  <span className="flex items-center gap-1 text-[10px] text-red-400">
                    <AlertCircle size={10} /> {f.error}
                  </span>
                )}
                {f.status === "done" && (
                  <span className="text-[10px] text-green-400">✓ Uploaded — under review</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            {pendingCount} file{pendingCount !== 1 ? "s" : ""} ready to upload
          </p>
          <div className="flex gap-3">
            <button onClick={() => setFiles([])} disabled={uploading} className="btn-ghost border border-border px-5">
              Clear All
            </button>
            <button
              onClick={uploadAll}
              disabled={uploading || pendingCount === 0}
              className="btn-primary px-8"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : `Upload ${pendingCount} Asset${pendingCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted">
            Drop some files above to get started. Each asset is reviewed within 48 hours.
          </p>
        </div>
      )}
    </div>
  );
}
