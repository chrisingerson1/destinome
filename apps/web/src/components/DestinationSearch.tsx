import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizeSearchText } from "../lib/search";

import {
  searchDestinations,
  type DestinationSearchResult,
} from "../lib/destinations";

type DestinationSearchProps = {
  onSelect: (destination: DestinationSearchResult) => void;
  scoresBySlug?: ReadonlyMap<string, number | null>;
  parentNamesBySlug?: ReadonlyMap<string, string>;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  showSuggestionsOnFocus?: boolean;
  excludeSlug?: string;
  excludeSlugs?: readonly string[];
};

const EMPTY_SCORES: ReadonlyMap<string, number | null> = new Map();
const EMPTY_PARENTS: ReadonlyMap<string, string> = new Map();
const EMPTY_EXCLUSIONS: readonly string[] = [];

export const DestinationSearch = ({
  onSelect,
  scoresBySlug = EMPTY_SCORES,
  parentNamesBySlug = EMPTY_PARENTS,
  id,
  placeholder = "Search destinations...",
  ariaLabel = "Search destinations",
  showSuggestionsOnFocus = false,
  excludeSlug,
  excludeSlugs = EMPTY_EXCLUSIONS,
}: DestinationSearchProps) => {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-search`;
  const resultsId = `${inputId}-results`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DestinationSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasError, setHasError] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);
  const search = query.trim();
  const canSearch =
    search.length >= 2 || (showSuggestionsOnFocus && search.length === 0);
  const dropdownOpen = isOpen && (showSuggestionsOnFocus || search.length >= 2);

  const knownParents = useMemo(
    () =>
      [
        ...new Set([...parentNamesBySlug.values()].map(normalizeSearchText)),
      ].sort((a, b) => b.length - a.length),
    [parentNamesBySlug],
  );

  useEffect(() => {
    if (!isOpen || !canSearch) return;

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setIsLoading(true);
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

        setResults(destinations.filter(({ slug }) => slug !== excludeSlug && !excludeSlugs.includes(slug)));
        setHasError(false);
        setActiveIndex(-1);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Destination search failed:", error);
          setResults([]);
          setHasError(true);
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
  }, [
    query,
    search,
    isOpen,
    canSearch,
    knownParents,
    parentNamesBySlug,
    excludeSlug,
    excludeSlugs,
    retryVersion,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [isOpen]);

  useEffect(() => {
    if (dropdownOpen && activeIndex >= 0) {
      document
        .getElementById(`${resultsId}-${activeIndex}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [dropdownOpen, activeIndex, resultsId]);

  const openDropdown = () => {
    if (isOpen) return;
    setIsOpen(true);
    setResults([]);
    setHasError(false);
    setIsLoading(canSearch);
    setActiveIndex(-1);
  };

  const handleSelect = (destination: DestinationSearchResult) => {
    setQuery(destination.name);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(destination);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !isOpen) {
      event.preventDefault();
      openDropdown();
      return;
    }

    if (!isOpen || isLoading || hasError || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index < 0 ? results.length - 1 : Math.max(index - 1, 0),
      );
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  return (
    <div
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsOpen(false);
      }}
      className="pointer-events-auto relative w-full"
    >
      <div className="pointer-events-auto overflow-hidden rounded-xl border border-white/15 bg-slate-950/90 text-white shadow-xl backdrop-blur-md focus-within:border-sky-300 focus-within:ring-1 focus-within:ring-sky-300">
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
            ref={inputRef}
            id={inputId}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
              setResults([]);
              setHasError(false);
              const nextSearch = event.target.value.trim();
              setIsLoading(
                nextSearch.length >= 2 ||
                  (showSuggestionsOnFocus && nextSearch.length === 0),
              );
            }}
            onFocus={openDropdown}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={ariaLabel}
            aria-expanded={dropdownOpen}
            aria-busy={(dropdownOpen && isLoading) || undefined}
            aria-controls={dropdownOpen ? resultsId : undefined}
            aria-activedescendant={
              dropdownOpen &&
              !isLoading &&
              !hasError &&
              activeIndex >= 0 &&
              activeIndex < results.length
                ? `${resultsId}-${activeIndex}`
                : undefined
            }
            role="combobox"
            aria-autocomplete="list"
            className="min-w-0 w-full bg-transparent text-base text-white outline-none placeholder:text-slate-400 sm:text-sm"
          />
          {showSuggestionsOnFocus && (
            <button
              type="button"
              aria-label="Toggle destination suggestions"
              aria-expanded={dropdownOpen}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (isOpen) setIsOpen(false);
                else {
                  openDropdown();
                  inputRef.current?.focus();
                }
              }}
              className="flex min-h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`size-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {dropdownOpen && (
        <div
          id={resultsId}
          role="listbox"
          aria-label="Destination suggestions"
          className="absolute top-full left-0 z-30 mt-1 max-h-80 w-full overflow-y-auto overscroll-contain rounded-xl border border-white/15 bg-slate-950 text-white shadow-xl"
        >
          {!canSearch && (
            <p className="px-4 py-3 text-sm text-slate-400">
              Type at least two characters to search.
            </p>
          )}
          {canSearch && isLoading && (
            <p role="status" className="px-4 py-3 text-sm text-slate-400">
              Searching...
            </p>
          )}

          {canSearch && !isLoading && hasError && (
            <div className="px-4 py-3 text-sm">
              <p role="alert" className="text-slate-400">
                Unable to search destinations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  setRetryVersion((version) => version + 1);
                }}
                className="mt-2 min-h-9 cursor-pointer text-sky-300 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                Try again
              </button>
            </div>
          )}
          {canSearch && !isLoading && !hasError && results.length === 0 && (
            <p role="status" className="px-4 py-3 text-sm text-slate-400">
              No destinations found.
            </p>
          )}

          {canSearch &&
            !isLoading &&
            !hasError &&
            results.map((destination, index) => {
              const score = scoresBySlug.get(destination.slug);
              const parentName =
                parentNamesBySlug.get(destination.slug) ??
                destination.parentDestination?.name;

              return (
                <button
                  key={destination.id}
                  id={`${resultsId}-${index}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(destination)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                    index === activeIndex ? "bg-white/15" : "hover:bg-white/10"
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
                      {!parentName &&
                        destination.adminArea &&
                        ` · ${destination.adminArea}`}
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
  );
};
