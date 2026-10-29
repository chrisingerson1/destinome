import { useState } from "react";
import type { MapDestination } from "../../types/destination";

export type MatchingDestinationsProps = {
  destinations: readonly MapDestination[];
  parentNamesBySlug: ReadonlyMap<string, string>;
  onSelect: (destination: MapDestination) => void;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
};

const RESULTS_BATCH_SIZE = 50;

type MatchingDestinationsPanelProps = MatchingDestinationsProps & {
  expanded: boolean;
  onToggle: () => void;
};

export const MatchingDestinations = ({
  destinations,
  parentNamesBySlug,
  onSelect,
  loading,
  error,
  onRetry,
  expanded,
  onToggle,
}: MatchingDestinationsPanelProps) => {
  const [visibleCount, setVisibleCount] = useState(RESULTS_BATCH_SIZE);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/90 text-white shadow-xl backdrop-blur-md">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="globe-matching-destinations"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-300"
      >
        <span className="flex-1">Matching Destinations</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums text-slate-300">
          {loading ? "…" : error ? "!" : destinations.length.toLocaleString()}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        id="globe-matching-destinations"
        aria-hidden={!expanded}
        inert={!expanded}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            role="region"
            aria-label="Matching destinations sorted by overall score"
            tabIndex={0}
            className="max-h-[min(32dvh,18rem)] overflow-y-auto overscroll-contain border-t border-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-300"
          >
            {error ? (
              <div className="p-4 text-xs text-slate-300">
                <p role="alert">Unable to load destination scores.</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 cursor-pointer text-sky-300 hover:text-sky-200"
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <p role="status" className="p-4 text-xs text-slate-400">
                Loading matching destinations…
              </p>
            ) : destinations.length === 0 ? (
              <p
                role="status"
                className="p-4 text-xs leading-relaxed text-slate-400"
              >
                No destinations match these filters. Lower a minimum score or clear
                a filter to see more places.
              </p>
            ) : (
              <ul className="divide-y divide-white/10">
                {destinations.slice(0, visibleCount).map((destination) => {
                  const parent = parentNamesBySlug.get(destination.slug);
                  return (
                    <li key={destination.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(destination)}
                        aria-label={`Fly to ${destination.name} on map`}
                        className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-300"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-100">
                            {destination.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-400">
                            {parent ? `${parent} · ` : ""}
                            {destination.country}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-sky-200">
                          {destination.overallScore === null
                            ? "Unrated"
                            : destination.overallScore.toFixed(2)}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {visibleCount < destinations.length && (
                  <li className="px-4 py-3 text-center text-xs">
                    <p className="mb-2 text-slate-400">
                      Showing {visibleCount.toLocaleString()} of{" "}
                      {destinations.length.toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((count) => count + RESULTS_BATCH_SIZE)
                      }
                      className="cursor-pointer rounded-sm text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                    >
                      Show more destinations
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
