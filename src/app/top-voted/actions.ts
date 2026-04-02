import { type Json } from "@/types/supabase";
import { type PublicFeedItemWithLikes } from "@/app/page/feed/actions";
import { presetToDateRange, type TimePreset } from "@/lib/top-voted-utils";
import { createClient } from "@/utils/supabase/client";

export async function fetchTopVoted({
  limit,
  offset,
  preset = "all",
  from,
  to,
}: {
  limit: number;
  offset: number;
  preset?: TimePreset;
  from?: string;
  to?: string;
}): Promise<{ items: PublicFeedItemWithLikes[]; hasMore: boolean }> {
  const supabase = createClient();
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
  const { data } = await (supabase as any)
    .rpc("get_top_voted_feed", {
      from_date: fromDate,
      to_date: toDate,
      limit_count: limit,
      offset_count: offset,
      user_id_param: user?.id ?? null,
    })
    .throwOnError() as { data: TopVotedRow[] };

  const items: PublicFeedItemWithLikes[] = (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    data: row.data as Json,
    dedupe_hash: row.dedupe_hash,
    score: row.score,
    created_at: row.created_at,
    updated_at: row.updated_at,
    repo_id: row.repo_id,
    search_text: row.search_text,
    search_vector: null,
    event_ids: row.event_ids,
    repositories: { org: row.org, repo: row.repo },
    likeCount: Number(row.like_count),
    isLiked: row.user_liked ?? false,
  }));

  return { items, hasMore: items.length === limit };
}

fetchTopVoted.key = "src/app/top-voted/actions/fetchTopVoted";
