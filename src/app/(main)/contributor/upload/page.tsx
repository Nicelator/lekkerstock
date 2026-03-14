"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle, AlertCircle, Film } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type AssetType = "photo" | "video" | "illustration" | "3d";

interface UploadFile {
  file: File;
  preview: string;
  title: string;
  description: string;
  tags: string;
  type: AssetType;
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

const TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
  { value: "illustration", label: "Illustration" },
  { value: "3d", label: "3D Asset" },
];

// ── Compress image using Canvas API ──
async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = objectUrl;
  });
}

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadFile[] = accepted.map(file => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      description: "",
      tags: "",
      type: file.type.startsWith("video/") ? "video" : "photo",
      status: "idle",
      progress: 0,
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
      if (prev[index].preview) URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadAll = async () => {
    const pending = files.filter(f => f.status === "idle");
    if (pending.length === 0) return;

    setUploading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); setUploading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "contributor") {
      toast.error("Contributor account required");
      setUploading(false);
      return;
    }

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status !== "idle") continue;

      updateFile(i, { status: "uploading", progress: 5 });

      try {
        const ext = f.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const timestamp = Date.now();
        const basePath = `${profile.id}/${timestamp}`;
        const isImage = f.file.type.startsWith("image/");

        // ── Step 1: Upload original file ──
        updateFile(i, { progress: 15 });
        const { error: origError } = await supabase.storage
          .from("assets")
          .upload(`${basePath}/original.${ext}`, f.file, {
            contentType: f.file.type,
            upsert: false,
          });
        if (origError) throw origError;

        const { data: { publicUrl: fileUrl } } = supabase.storage
          .from("assets")
          .getPublicUrl(`${basePath}/original.${ext}`);

        updateFile(i, { progress: 50 });

        // ── Step 2: Compress & upload preview (images only) ──
        let previewUrl = fileUrl;
        let thumbnailUrl = fileUrl;

        if (isImage) {
          updateFile(i, { progress: 55 });

          // Compressed preview — max 1200px, 82% quality
          const previewBlob = await compressImage(f.file, 1200, 0.82);
          const { error: previewError } = await supabase.storage
            .from("previews")
            .upload(`${basePath}/preview.jpg`, previewBlob, {
              contentType: "image/jpeg",
              upsert: false,
            });
          if (previewError) throw previewError;

          const { data: { publicUrl: pUrl } } = supabase.storage
            .from("previews")
            .getPublicUrl(`${basePath}/preview.jpg`);
          previewUrl = pUrl;

          updateFile(i, { progress: 75 });

          // Thumbnail — max 400px, 75% quality
          const thumbBlob = await compressImage(f.file, 400, 0.75);
          const { error: thumbError } = await supabase.storage
            .from("previews")
            .upload(`${basePath}/thumb.jpg`, thumbBlob, {
              contentType: "image/jpeg",
              upsert: false,
            });
          if (thumbError) throw thumbError;

          const { data: { publicUrl: tUrl } } = supabase.storage
            .from("previews")
            .getPublicUrl(`${basePath}/thumb.jpg`);
          thumbnailUrl = tUrl;
        }

        updateFile(i, { progress: 88 });

        // ── Step 3: Save to database ──
        const { error: dbError } = await supabase
          .from("assets")
          .insert({
            contributor_id: profile.id,
            title: f.title || f.file.name.replace(/\.[^.]+$/, ""),
            description: f.description || null,
            tags: f.tags.split(",").map(t => t.trim()).filter(Boolean),
            type: f.type,
            status: "pending",
            file_url: fileUrl,
            preview_url: previewUrl,
            thumbnail_url: thumbnailUrl,
            file_size: f.file.size,
            is_editorial: false,
            price_usd: 15,
            price_ngn: 22500,
          });

        if (dbError) throw dbError;

        updateFile(i, { status: "done", progress: 100 });
        successCount++;
      } catch (err: any) {
        console.error("Upload error:", err);
        updateFile(i, { status: "error", error: err.message || "Upload failed", progress: 0 });
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
    <div style={{
      minHeight: "100vh", background: "#0e0b08",
      maxWidth: "900px", margin: "0 auto",
      padding: "96px 24px 48px",
    }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "40px",
          fontWeight: 700, color: "#faf6ef", marginBottom: "8px",
        }}>
          Upload Content
        </h1>
        <p style={{ color: "rgba(250,246,239,0.4)", fontSize: "14px", fontFamily: "'Outfit', sans-serif" }}>
          Photos, videos, illustrations and 3D assets. All files are reviewed before going live.
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "#c8692e" : "rgba(200,105,46,0.25)"}`,
          borderRadius: "6px", padding: "48px 24px", textAlign: "center",
          cursor: "pointer", marginBottom: "24px",
          background: isDragActive ? "rgba(200,105,46,0.06)" : "transparent",
          transition: "all 0.2s",
        }}
      >
        <input {...getInputProps()} />
        <Upload size={36} style={{ margin: "0 auto 16px", display: "block", color: isDragActive ? "#c8692e" : "rgba(250,246,239,0.3)" }} />
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif", marginBottom: "6px" }}>
          {isDragActive ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p style={{ fontSize: "13px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif", marginBottom: "8px" }}>
          or click to browse
        </p>
        <p style={{ fontSize: "11px", color: "rgba(250,246,239,0.2)", fontFamily: "'Outfit', sans-serif" }}>
          JPG, PNG, WebP, TIFF, MP4, MOV · Max 500MB per file · Previews auto-compressed
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {files.map((f, i) => (
            <div key={i} style={{
              background: "rgba(22,16,8,0.7)",
              border: `1px solid ${
                f.status === "done" ? "rgba(46,204,113,0.3)" :
                f.status === "error" ? "rgba(231,76,60,0.3)" :
                f.status === "uploading" ? "rgba(200,105,46,0.3)" :
                "rgba(200,105,46,0.12)"
              }`,
              borderRadius: "4px", padding: "16px",
            }}>
              <div style={{ display: "flex", gap: "16px" }}>
                {/* Preview */}
                <div style={{
                  width: "80px", height: "60px", borderRadius: "3px",
                  overflow: "hidden", background: "rgba(250,246,239,0.05)",
                  flexShrink: 0, position: "relative",
                }}>
                  {f.preview ? (
                    <img src={f.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Film size={20} color="rgba(250,246,239,0.3)" />
                    </div>
                  )}
                  {f.status === "done" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(46,204,113,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle size={20} color="white" />
                    </div>
                  )}
                  {f.status === "uploading" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontSize: "12px", color: "white", fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>{f.progress}%</div>
                    </div>
                  )}
                </div>

                {/* Fields */}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(250,246,239,0.4)", marginBottom: "6px", fontFamily: "'Outfit', sans-serif" }}>Title *</label>
                    <input value={f.title} onChange={e => updateFile(i, { title: e.target.value })}
                      disabled={f.status !== "idle"} placeholder="Give your asset a title"
                      style={{ width: "100%", padding: "8px 12px", background: "rgba(250,246,239,0.05)", border: "1px solid rgba(200,105,46,0.15)", borderRadius: "3px", color: "#faf6ef", fontFamily: "'Outfit', sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = "#c8692e"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(200,105,46,0.15)"; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(250,246,239,0.4)", marginBottom: "6px", fontFamily: "'Outfit', sans-serif" }}>Type</label>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {TYPE_OPTIONS.map(({ value, label }) => (
                        <button key={value} type="button" disabled={f.status !== "idle"}
                          onClick={() => updateFile(i, { type: value })}
                          style={{ flex: 1, padding: "7px 4px", borderRadius: "3px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", cursor: "pointer", border: "none", fontFamily: "'Outfit', sans-serif", transition: "all 0.2s", background: f.type === value ? "#c8692e" : "rgba(250,246,239,0.06)", color: f.type === value ? "white" : "rgba(250,246,239,0.4)" }}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(250,246,239,0.4)", marginBottom: "6px", fontFamily: "'Outfit', sans-serif" }}>Tags (comma separated)</label>
                    <input value={f.tags} onChange={e => updateFile(i, { tags: e.target.value })}
                      disabled={f.status !== "idle"} placeholder="Lagos, Nigeria, street, urban"
                      style={{ width: "100%", padding: "8px 12px", background: "rgba(250,246,239,0.05)", border: "1px solid rgba(200,105,46,0.15)", borderRadius: "3px", color: "#faf6ef", fontFamily: "'Outfit', sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = "#c8692e"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(200,105,46,0.15)"; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(250,246,239,0.4)", marginBottom: "6px", fontFamily: "'Outfit', sans-serif" }}>Description (optional)</label>
                    <input value={f.description} onChange={e => updateFile(i, { description: e.target.value })}
                      disabled={f.status !== "idle"} placeholder="Brief description..."
                      style={{ width: "100%", padding: "8px 12px", background: "rgba(250,246,239,0.05)", border: "1px solid rgba(200,105,46,0.15)", borderRadius: "3px", color: "#faf6ef", fontFamily: "'Outfit', sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = "#c8692e"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(200,105,46,0.15)"; }}
                    />
                  </div>
                </div>

                {/* Remove */}
                <button onClick={() => removeFile(i)} disabled={f.status === "uploading"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(250,246,239,0.3)", alignSelf: "flex-start", padding: "2px", transition: "color 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#e74c3c"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(250,246,239,0.3)"; }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Progress bar */}
              {f.status === "uploading" && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ height: "3px", background: "rgba(200,105,46,0.15)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "#c8692e", borderRadius: "99px", width: `${f.progress}%`, transition: "width 0.4s ease" }} />
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif", marginTop: "4px" }}>
                    {f.progress < 50 ? "Uploading original..." : f.progress < 80 ? "Generating preview & thumbnail..." : "Saving..."}
                  </div>
                </div>
              )}

              {/* Meta + status */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", paddingLeft: "96px" }}>
                <span style={{ fontSize: "11px", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif" }}>
                  {f.file.name} · {formatBytes(f.file.size)}
                </span>
                {f.status === "error" && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#e74c3c", fontFamily: "'Outfit', sans-serif" }}>
                    <AlertCircle size={11} /> {f.error}
                  </span>
                )}
                {f.status === "done" && (
                  <span style={{ fontSize: "11px", color: "#2ecc71", fontFamily: "'Outfit', sans-serif" }}>
                    ✓ Uploaded — under review
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "13px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>
            {pendingCount} file{pendingCount !== 1 ? "s" : ""} ready to upload
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setFiles([])} disabled={uploading} style={{
              padding: "10px 20px", background: "transparent",
              border: "1px solid rgba(200,105,46,0.2)", borderRadius: "3px",
              color: "rgba(250,246,239,0.5)", fontFamily: "'Outfit', sans-serif",
              fontSize: "13px", cursor: "pointer",
            }}>
              Clear All
            </button>
            <button onClick={uploadAll} disabled={uploading || pendingCount === 0} style={{
              padding: "10px 28px",
              background: uploading || pendingCount === 0 ? "rgba(200,105,46,0.4)" : "#c8692e",
              border: "none", borderRadius: "3px", color: "white",
              fontFamily: "'Outfit', sans-serif", fontSize: "13px", fontWeight: 600,
              cursor: uploading || pendingCount === 0 ? "not-allowed" : "pointer",
              transition: "background 0.2s", display: "flex", alignItems: "center", gap: "8px",
            }}
              onMouseEnter={e => { if (!uploading && pendingCount > 0) (e.currentTarget as HTMLElement).style.background = "#e8843a"; }}
              onMouseLeave={e => { if (!uploading && pendingCount > 0) (e.currentTarget as HTMLElement).style.background = "#c8692e"; }}
            >
              {uploading ? (
                <>
                  <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Uploading...
                </>
              ) : `Upload ${pendingCount} Asset${pendingCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {files.length === 0 && (
        <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif" }}>
          Drop some files above to get started. Each asset is reviewed within 48 hours.
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
