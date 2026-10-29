import { useState } from "react";
import { Link } from "react-router";

import { getScoreTier, SCORE_TIERS } from "../../config/scoreTiers";
import { destinationHref } from "../../lib/discovery";

import type { DestinationDetail } from "../../types/destination";

type ExploreNeighborhoodsProps = {
  neighborhoods: DestinationDetail["neighborhoods"];
  returnTo?: string;
};

const INITIAL_VISIBLE_COUNT = 6;

export const ExploreNeighborhoods = ({
  neighborhoods,
  returnTo = "/map",
}: ExploreNeighborhoodsProps) => {
  const [showAll, setShowAll] = useState(false);

  if (neighborhoods.length === 0) {
    return null;
  }

  const visibleNeighborhoods = showAll
    ? neighborhoods
    : neighborhoods.slice(0, INITIAL_VISIBLE_COUNT);

  const hasMore = neighborhoods.length > INITIAL_VISIBLE_COUNT;

  return (
    <section className="overflow-hidden rounded-xl border border-white/15 bg-slate-950/90 text-white shadow-xl backdrop-blur-md">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Explore Neighborhoods</h2>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums text-slate-400">
            {neighborhoods.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Discover more within this destination.
        </p>
      </div>

      <ul className="divide-y divide-white/10">
        {visibleNeighborhoods.map((neighborhood) => {
          const tier = getScoreTier(neighborhood.overallScore);
          const color = SCORE_TIERS[tier].color;

          return (
            <li key={neighborhood.id}>
              <Link
                to={destinationHref(neighborhood.slug, returnTo)}
                className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/10"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-sm font-medium text-slate-200 transition-colors group-hover:text-white">
                    {neighborhood.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums text-slate-300">
                    {neighborhood.overallScore === null
                      ? "N/A"
                      : neighborhood.overallScore.toFixed(2)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-slate-500 transition-colors group-hover:text-white"
                  >
                    →
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((previous) => !previous)}
          aria-expanded={showAll}
          className="w-full cursor-pointer border-t border-white/10 px-4 py-3 text-center text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {showAll
            ? "Show Fewer Neighborhoods"
            : `View All ${neighborhoods.length} Neighborhoods`}
        </button>
      )}
    </section>
  );
};
