import { useEffect, useMemo, useState } from "react";

import {
  searchDestinations,
  type DestinationSearchResult,
} from "../../lib/destinations";

type DestinationSearchProps = {
  onSelect: (destination: DestinationSearchResult) => void;
  scoresBySlug: ReadonlyMap<string, number | null>;
  parentNamesBySlug: ReadonlyMap<string, string>;
};

const normalizeSearchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[,\s]+/g, " ")
    .trim();

export const DestinationSearch = ({
  onSelect,
  scoresBySlug,
  parentNamesBySlug,
}: DestinationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DestinationSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const knownParents = useMemo(
    () =>
      [
        ...new Set([...parentNamesBySlug.values()].map(normalizeSearchText)),
      ].sort((a, b) => b.length - a.length),
    [parentNamesBySlug],
  );

  useEffect(() => {
    const search = query.trim();

    if (search.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const normalizedQuery = normalizeSearchText(search);
        const words = normalizedQuery.split(" ");

        // Detect a parent name or partial parent name at the
        // end of the query, e.g. "charlestown bo".
        const parentMatch = words
          .slice(1)
          .map((_, index) => {
            const split = index + 1;

            return {
              destinationQuery: words.slice(0, split).join(" "),
              parentPrefix: words.slice(split).join(" "),
            };
          })
          .find(
            ({ destinationQuery, parentPrefix }) =>
              destinationQuery.length >= 2 &&
              knownParents.some((parent) => parent.startsWith(parentPrefix)),
          );

        const hasExactParent =
          parentMatch !== undefined &&
          knownParents.includes(parentMatch.parentPrefix);

        // First try the normal search, unless the complete
        // parent name was explicitly supplied.
        let destinations: DestinationSearchResult[] = hasExactParent
          ? []
          : await searchDestinations(search, controller.signal);

        // If necessary, search for the child destination and
        // filter by its parent, accepting partial parent names.
        if (parentMatch && (hasExactParent || destinations.length === 0)) {
          const matches = await searchDestinations(
            parentMatch.destinationQuery,
            controller.signal,
          );

          const contextualMatches = matches.filter((destination) =>
            normalizeSearchText(
              parentNamesBySlug.get(destination.slug) ?? "",
            ).startsWith(parentMatch.parentPrefix),
          );

          if (contextualMatches.length > 0) {
            destinations = contextualMatches;
          } else if (hasExactParent) {
            // Preserve ordinary searches when an apparent
            // parent match doesn't actually resolve.
            destinations = await searchDestinations(search, controller.signal);
          }
        }

        if (controller.signal.aborted) return;

        setResults(destinations);
        setActiveIndex(-1);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Destination search failed:", error);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, knownParents, parentNamesBySlug]);

  const handleSelect = (destination: DestinationSearchResult) => {
    setQuery(destination.name);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(destination);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (!isOpen || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  return (
    <div className="pointer-events-none absolute top-5 left-5 z-20 w-[min(380px,calc(100vw-40px))]">
      <div className="pointer-events-auto overflow-hidden rounded-xl border border-white/15 bg-slate-950/90 text-white shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-slate-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search destinations..."
            aria-label="Search destinations"
            aria-expanded={isOpen}
            aria-controls="destination-search-results"
            aria-activedescendant={
              activeIndex >= 0 ? `destination-result-${activeIndex}` : undefined
            }
            role="combobox"
            aria-autocomplete="list"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
          />
        </div>

        {isOpen && query.trim().length >= 2 && (
          <div
            id="destination-search-results"
            role="listbox"
            className="max-h-80 overflow-y-auto border-t border-white/10"
          >
            {isLoading && (
              <p className="px-4 py-3 text-sm text-slate-400">Searching...</p>
            )}

            {!isLoading && results.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400">
                No destinations found.
              </p>
            )}

            {!isLoading &&
              results.map((destination, index) => {
                const score = scoresBySlug.get(destination.slug);
                const parentName = parentNamesBySlug.get(destination.slug);

                return (
                  <button
                    key={destination.id}
                    id={`destination-result-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(destination)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                      index === activeIndex
                        ? "bg-white/15"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {destination.name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {parentName && (
                          <>
                            <span className="text-slate-300">{parentName}</span>
                            <span className="mx-1 text-slate-500">·</span>
                          </>
                        )}
                        {destination.country.name}
                      </p>
                    </div>

                    {typeof score === "number" && (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-200">
                        {score.toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
