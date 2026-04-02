import { describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";

import { GET } from "./route";

const mockCreateClient = vi.hoisted(() => vi.fn());

vi.mock("@/utils/supabase/server", () => ({
  createClient: mockCreateClient,
}));

function createRequest(url: string): NextRequest {
  return new NextRequest(url);
}

function createRpcMock(result: {
  data: unknown[] | null;
  error: { message: string } | null;
}) {
  return {
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: null }, error: null }),
    },
    rpc: () => Promise.resolve(result),
  };
}

describe("GET /api/feed/top-voted", () => {
  it("uses default limit 20 and offset 0", async () => {
    mockCreateClient.mockResolvedValue(
      createRpcMock({ data: [], error: null }),
    );

    const req = createRequest("http://localhost/api/feed/top-voted");
    const res = await GET(req);
    const json = await res.json();
    expect(json.pagination).toEqual({
      offset: 0,
      limit: 20,
      has_more: false,
    });
  });

  it("caps limit at 100", async () => {
    const rpcSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      rpc: rpcSpy,
    });

    const req = createRequest(
      "http://localhost/api/feed/top-voted?limit=200&offset=0",
    );
    const res = await GET(req);
    const json = await res.json();
    expect(json.pagination.limit).toBe(100);
    expect(rpcSpy).toHaveBeenCalledWith(
      "get_top_voted_feed",
      expect.objectContaining({ limit_count: 100 }),
    );
  });

  it("returns 500 on RPC error", async () => {
    mockCreateClient.mockResolvedValue(
      createRpcMock({ data: null, error: { message: "RPC error" } }),
    );

    const req = createRequest("http://localhost/api/feed/top-voted");
    const res = await GET(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("RPC error");
  });

  it("passes from_date and to_date from custom range params", async () => {
    const rpcSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      rpc: rpcSpy,
    });

    const req = createRequest(
      "http://localhost/api/feed/top-voted?from=2024-01-01&to=2024-01-31",
    );
    await GET(req);
    expect(rpcSpy).toHaveBeenCalledWith(
      "get_top_voted_feed",
      expect.objectContaining({
        from_date: new Date("2024-01-01").toISOString(),
        to_date: new Date("2024-01-31").toISOString(),
      }),
    );
  });

  it("passes null dates for 'all' preset", async () => {
    const rpcSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      rpc: rpcSpy,
    });

    const req = createRequest(
      "http://localhost/api/feed/top-voted?preset=all",
    );
    await GET(req);
    expect(rpcSpy).toHaveBeenCalledWith(
      "get_top_voted_feed",
      expect.objectContaining({
        from_date: null,
        to_date: null,
      }),
    );
  });

  it("passes a from_date for '24h' preset", async () => {
    const rpcSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
      rpc: rpcSpy,
    });

    const before = Date.now();
    const req = createRequest(
      "http://localhost/api/feed/top-voted?preset=24h",
    );
    await GET(req);
    const after = Date.now();

    const call = rpcSpy.mock.calls[0][1] as { from_date: string };
    expect(call.from_date).not.toBeNull();
    const fromMs = new Date(call.from_date).getTime();
    expect(fromMs).toBeGreaterThanOrEqual(before - 24 * 60 * 60 * 1000 - 100);
    expect(fromMs).toBeLessThanOrEqual(after - 24 * 60 * 60 * 1000 + 100);
  });

  it("returns has_more true when items equal limit", async () => {
    const mockRow = {
      id: "uuid-1",
      type: "push",
      data: {},
      dedupe_hash: "hash-1",
      score: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      repo_id: "repo-uuid",
      search_text: null,
      event_ids: null,
      like_count: 5,
      user_liked: false,
      org: "my-org",
      repo: "my-repo",
    };
    mockCreateClient.mockResolvedValue(
      createRpcMock({ data: [mockRow], error: null }),
    );

    const req = createRequest(
      "http://localhost/api/feed/top-voted?limit=1&offset=0",
    );
    const res = await GET(req);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.pagination.has_more).toBe(true);
  });

  it("items include like_count field", async () => {
    const mockRow = {
      id: "uuid-2",
      type: "push",
      data: {},
      dedupe_hash: "hash-2",
      score: 0,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      repo_id: "repo-uuid",
      search_text: null,
      event_ids: null,
      like_count: 42,
      user_liked: true,
      org: "my-org",
      repo: "my-repo",
    };
    mockCreateClient.mockResolvedValue(
      createRpcMock({ data: [mockRow], error: null }),
    );

    const req = createRequest("http://localhost/api/feed/top-voted");
    const res = await GET(req);
    const json = await res.json();
    expect(json.items[0].like_count).toBe(42);
    expect(json.items[0].user_liked).toBe(true);
  });
});
