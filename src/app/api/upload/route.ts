import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, plan")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "contributor") {
    return NextResponse.json({ error: "Contributor account required" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const preview = formData.get("preview") as File | null;
  const metadata = JSON.parse(formData.get("metadata") as string || "{}");

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  const timestamp = Date.now();
  const basePath = `${profile.id}/${timestamp}`;

  try {
    const fileBuffer = await file.arrayBuffer();
    const { error: fileError } = await supabase.storage
      .from("assets")
      .upload(`${basePath}/original.${ext}`, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (fileError) throw fileError;

    const { data: { publicUrl: fileUrl } } = supabase.storage
      .from("assets")
      .getPublicUrl(`${basePath}/original.${ext}`);

    let previewUrl = fileUrl;
    if (preview) {
      const previewBuffer = await preview.arrayBuffer();
      await supabase.storage
        .from("previews")
        .upload(`${basePath}/preview.jpg`, previewBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });
      const { data: { publicUrl } } = supabase.storage
        .from("previews")
        .getPublicUrl(`${basePath}/preview.jpg`);
      previewUrl = publicUrl;
    }

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .insert({
        contributor_id: profile.id,
        title: metadata.title || file.name.replace(/\.[^.]+$/, ""),
        description: metadata.description || null,
        tags: metadata.tags || [],
        type: metadata.type || "photo",
        status: "pending",
        file_url: fileUrl,
        preview_url: previewUrl,
        thumbnail_url: previewUrl,
        file_size: file.size,
        width: metadata.width || null,
        height: metadata.height || null,
        is_editorial: metadata.is_editorial || false,
        price_usd: metadata.price_usd || 15,
        price_ngn: metadata.price_ngn || 22500,
      })
      .select()
      .single();

    if (assetError) throw assetError;

    return NextResponse.json({ asset });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}