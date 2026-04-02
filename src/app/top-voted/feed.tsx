"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Loader, X } from "lucide-react";
import React, { useRef, useCallback, useState } from "react";

import ActivityCard from "@/components/shared/activity-card";
import ScrollToTopButton from "@/components/shared/scroll-to-top-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBackUrl } from "@/hooks/use-back-url";
import { TIME_PRESETS, type TimePreset } from "@/lib/top-voted-utils";

import { fetchTopVoted } from "./actions";

const LIMIT = 20;

function TopVotedFeed() {
  const [preset, setPreset] = useState<TimePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const backUrl = useBackUrl();

  const hasCustomRange = Boolean(fromDate || toDate);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: [fetchTopVoted.key, preset, fromDate, toDate],
    queryFn: ({ pageParam }) =>
      fetchTopVoted({
        limit: LIMIT,
        offset: pageParam,
        preset,
        from: fromDate || undefined,
        to: toDate || undefined,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.reduce((acc, page) => acc + page.items.length, 0);
      }
      return undefined;
    },
    initialPageParam: 0,
    placeholderData: keepPreviousData,
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const observerMiddle = useRef<IntersectionObserver | null>(null);
  const observerLast = useRef<IntersectionObserver | null>(null);
  const sentinelMiddleIndex =
    items.length > 0 ? Math.floor(items.length / 2) : -1;
  const sentinelLastIndex = items.length > 0 ? items.length - 1 : -1;

  const sentinelMiddleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerMiddle.current) observerMiddle.current.disconnect();
      observerMiddle.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerMiddle.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage],
  );

  const sentinelLastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerLast.current) observerLast.current.disconnect();
      observerLast.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerLast.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage],
  );

  const handleScrollToTop = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePresetClick = (value: TimePreset) => {
    setPreset(value);
    setFromDate("");
    setToDate("");
  };

  const handleClearCustomRange = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <>
      <ScrollToTopButton onScrollToTop={handleScrollToTop} />

      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          {TIME_PRESETS.map(({ value, label }) => {
            const isActive = !hasCustomRange && preset === value;
            return (
              <Button
                key={value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(value)}
              >
                {label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">From</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">To</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-auto"
            />
          </div>
          {hasCustomRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCustomRange}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {items.length === 0 && !isLoading && (
          <div className="text-muted-foreground">No activity yet.</div>
        )}
        {isError && (
          <div className="text-muted-foreground">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        )}
        {isLoading && (
          <div className="flex flex-row items-center gap-2 text-muted-foreground">
            <Loader className="animate-spin w-4 h-4" /> Loading...
          </div>
        )}
        {items.map((item, idx) => {
          const org = item.repositories.org;
          const repo = item.repositories.repo;
          let ref;
          if (hasNextPage) {
            if (idx === sentinelMiddleIndex) ref = sentinelMiddleRef;
            if (idx === sentinelLastIndex) ref = sentinelLastRef;
          }
          return (
            <div key={item.id} ref={ref}>
              <ActivityCard item={item} repo={repo} org={org} back={backUrl} />
            </div>
          );
        })}
        {isFetchingNextPage && (
          <div className="flex flex-row items-center gap-2 text-muted-foreground">
            <Loader className="animate-spin w-4 h-4" /> Loading more...
          </div>
        )}
        {items.length > 0 && !hasNextPage && !isLoading && (
          <div className="text-muted-foreground text-center pb-4 text-sm">
            - End of feed -
          </div>
        )}
      </div>
    </>
  );
}

export default React.memo(TopVotedFeed);
