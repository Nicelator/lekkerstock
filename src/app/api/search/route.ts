// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const sort = searchParams.get("sort") || "latest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let dbQuery = supabase
    .from("assets")
    .select(`
      *,
      contributor:profiles!contributor_id(id, full_name, avatar_url, plan)
    `, { count: "exact" })
    .eq("status", "approved");

  // Type filter
  if (type !== "all") {
    dbQuery = dbQuery.eq("type", type);
  }

  // Full-text search
  if (query) {
    dbQuery = dbQuery.textSearch("search_vector", query, { type: "websearch" });
  }

  // Sorting
  switch (sort) {
    case "popular":
      dbQuery = dbQuery.order("views", { ascending: false });
      break;
    case "downloads":
      dbQuery = dbQuery.order("downloads", { ascending: false });
      break;
    default:
      dbQuery = dbQuery.order("created_at", { ascending: false });
  }

  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data: assets, count, error } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    assets,
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
  });
}
