set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_top_voted_feed(
  from_date timestamptz DEFAULT NULL,
  to_date timestamptz DEFAULT NULL,
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0,
  user_id_param uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  type text,
  data jsonb,
  dedupe_hash text,
  score integer,
  created_at timestamptz,
  updated_at timestamptz,
  repo_id uuid,
  search_text text,
  event_ids text[],
  like_count bigint,
  user_liked boolean,
  org text,
  repo text
)
LANGUAGE sql
AS $function$
  SELECT
    pt.id,
    pt.type,
    pt.data,
    pt.dedupe_hash,
    pt.score,
    pt.created_at,
    pt.updated_at,
    pt.repo_id,
    pt.search_text,
    pt.event_ids,
    COUNT(tl.id)::bigint AS like_count,
    BOOL_OR(tl.user_id = user_id_param) AS user_liked,
    r.org,
    r.repo
  FROM public_timeline pt
  INNER JOIN repositories r ON r.id = pt.repo_id
  LEFT JOIN timeline_likes tl ON tl.dedupe_hash = pt.dedupe_hash
  WHERE (from_date IS NULL OR pt.updated_at >= from_date)
    AND (to_date IS NULL OR pt.updated_at <= to_date)
  GROUP BY pt.id, r.org, r.repo
  ORDER BY like_count DESC, pt.updated_at DESC
  LIMIT limit_count
  OFFSET offset_count
$function$;
