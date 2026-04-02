import { NextRequest, NextResponse } from "next/server";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { presetToDateRange } from "@/lib/top-voted-utils";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const preset = searchParams.get("preset") ?? "all";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Custom date range takes precedence over preset
  let fromDate: string | null = null;
  let toDate: string | null = null;
  if (from || to) {
    fromDate = from ? new Date(from).toISOString() : null;
    toDate = to ? new Date(to).toISOString() : null;
  } else {
    const range = presetToDateRange(preset);
    fromDate = range.from ?? null;
    toDate = range.to ?? null;
  }

  type TopVotedRow = {
    id: string;
    type: string;
    data: unknown;
    dedupe_hash: string;
    score: number;
    created_at: string;
    updated_at: string;
    repo_id: string;
    search_text: string | null;
    event_ids: string[] | null;
    like_count: number;
    user_liked: boolean | null;
    org: string;
    repo: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_top_voted_feed", {
    from_date: fromDate,
    to_date: toDate,
    limit_count: limit,
    offset_count: offset,
    user_id_param: user?.id ?? null,
  }) as { data: TopVotedRow[] | null; error: { message: string } | null };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((row) => ({
    ...normalizeTimelineItem({
      id: row.id,
      type: row.type,
      data: row.data,
      updated_at: row.updated_at,
      org: row.org,
      repo: row.repo,
      dedupe_hash: row.dedupe_hash,
    }),
    like_count: Number(row.like_count),
    user_liked: row.user_liked ?? false,
  }));

  const has_more = items.length === limit;

  return NextResponse.json({
    items,
    pagination: { offset, limit, has_more },
  });
}
