import TopVotedFeed from "./feed";

export const metadata = {
  title: "Top Voted — Nom",
  description: "Most upvoted posts in the Nom feed, ranked by community likes.",
};

export default function TopVotedPage() {
  return (
    <div className="px-2 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-jersey-15 uppercase">🔥 Top Voted</h1>
        <p className="text-sm text-muted-foreground">
          Most upvoted posts, sorted by likes. Filter by time range or pick
          custom dates.
        </p>
      </div>
      <TopVotedFeed />
    </div>
  );
}
