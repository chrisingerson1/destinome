import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router";

import {
  destinationHref,
  discoverySearch,
  getComparisonCategories,
  getComparisonCategoryOptions,
  getDestination,
  getSecondaryDestinationSlug,
  getThirdDestinationSlug,
  updateComparisonCategories,
  updatePrimaryDestination,
  updateSecondaryDestination,
  updateThirdDestination,
  useReadableSearchParams,
  useMapReturnTo,
} from "../lib";
import {
  ComparisonCategoryPicker,
  ComparisonDestinationSlot,
  ComparisonCategoryRows,
  type ComparisonColumn,
} from "../components/compare";
import { DestinationSearch } from "../components/DestinationSearch";

export const ComparePage = () => {
  const params = useReadableSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const slug = params.get("destination")?.trim() || undefined;
  const secondarySlug = getSecondaryDestinationSlug(params);
  const thirdSlug = getThirdDestinationSlug(params);
  const [openThirdFor, setOpenThirdFor] = useState<string | null>(null);
  const thirdTabRef = useRef<HTMLButtonElement>(null);
  const showThirdColumn = Boolean(thirdSlug) || (Boolean(slug) && openThirdFor === slug);
  const desktopColumns = showThirdColumn
    ? "lg:grid-cols-[minmax(140px,0.6fr)_repeat(3,minmax(0,1fr))]"
    : "lg:grid-cols-[minmax(140px,0.6fr)_repeat(2,minmax(0,1fr))]";
  const selectedCategories = getComparisonCategories(params);
  const returnTo = useMapReturnTo();
  const primaryQuery = useQuery({
    queryKey: ["destination", slug],
    queryFn: ({ signal }) => {
      if (!slug) throw new Error("Missing destination slug");
      return getDestination(slug, signal);
    },
    enabled: Boolean(slug),
  });
  const {
    data: destination,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = primaryQuery;
  const secondaryQuery = useQuery({
    queryKey: ["destination", secondarySlug],
    queryFn: ({ signal }) => {
      if (!secondarySlug) throw new Error("Missing destination slug");
      return getDestination(secondarySlug, signal);
    },
    enabled: Boolean(secondarySlug),
  });
  const thirdQuery = useQuery({
    queryKey: ["destination", thirdSlug],
    queryFn: ({ signal }) => {
      if (!thirdSlug) throw new Error("Missing destination slug");
      return getDestination(thirdSlug, signal);
    },
    enabled: Boolean(thirdSlug),
  });
  const primaryExclusions = useMemo(
    () => [secondarySlug, thirdSlug].filter((value): value is string => Boolean(value)),
    [secondarySlug, thirdSlug],
  );
  const secondaryExclusions = useMemo(
    () => [slug, thirdSlug].filter((value): value is string => Boolean(value)),
    [slug, thirdSlug],
  );
  const thirdExclusions = useMemo(
    () => [slug, secondarySlug].filter((value): value is string => Boolean(value)),
    [slug, secondarySlug],
  );
  const categoryOptions = useMemo(
    () =>
      getComparisonCategoryOptions(
        destination?.scores,
        secondaryQuery.data?.scores,
        thirdQuery.data?.scores,
      ),
    [destination?.scores, secondaryQuery.data?.scores, thirdQuery.data?.scores],
  );
  const columns: ComparisonColumn[] = [
    { id: "primary", label: "First destination", destination, state: "ready" },
    {
      id: "secondary", label: "Second destination", destination: secondaryQuery.data,
      state: !secondarySlug ? "empty" : secondaryQuery.isError ? "error" : secondaryQuery.isPending ? "loading" : "ready",
    },
  ];
  if (showThirdColumn) {
    columns.push({
      id: "third", label: "Third destination", destination: thirdQuery.data,
      state: !thirdSlug ? "empty" : thirdQuery.isError ? "error" : thirdQuery.isPending ? "loading" : "ready",
    });
  }

  useEffect(() => {
    document.title = destination
      ? `Destinome | Compare ${destination.name}`
      : "Destinome | Compare destinations";
    return () => {
      document.title = "Destinome";
    };
  }, [destination]);

  const selectSecondary = (selectedSlug: string | null) => {
    if (selectedSlug === secondarySlug) return;
    void navigate(
      {
        search: discoverySearch(
          updateSecondaryDestination(params, selectedSlug),
        ),
        hash: location.hash,
      },
      { preventScrollReset: true, state: location.state },
    );
  };

  const selectPrimary = (selectedSlug: string) => {
    if (selectedSlug === slug || primaryExclusions.includes(selectedSlug)) return;
    if (openThirdFor === slug) setOpenThirdFor(selectedSlug);
    void navigate(
      {
        search: discoverySearch(updatePrimaryDestination(params, selectedSlug)),
        hash: location.hash,
      },
      { preventScrollReset: true, state: location.state },
    );
  };

  const selectThird = (selectedSlug: string | null) => {
    if (selectedSlug === null) {
      setOpenThirdFor(null);
      thirdTabRef.current?.focus();
    }
    if (selectedSlug === thirdSlug) return;
    void navigate(
      { search: discoverySearch(updateThirdDestination(params, selectedSlug)), hash: location.hash },
      { preventScrollReset: true, state: location.state },
    );
  };

  const selectCategories = (categories: string[]) => {
    void navigate(
      {
        search: discoverySearch(updateComparisonCategories(params, categories)),
        hash: location.hash,
      },
      { preventScrollReset: true, state: location.state },
    );
  };

  return (
    <main className="min-h-[calc(100dvh-var(--navbar-height))] bg-[#05080f] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Link
          to={destination ? destinationHref(destination.slug) : returnTo}
          className="inline-flex min-h-11 items-center text-sm text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
        >
          ← Back to {destination ? destination.name : "map"}
        </Link>
        <h1 className="mt-3 mb-8 text-3xl font-semibold tracking-tight md:text-4xl">
          Compare destinations
        </h1>

        {!slug ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">
              Choose a destination to start comparing
            </h2>
            <div className="mx-auto mt-6 max-w-md text-left">
              <label
                htmlFor="primary-comparison-destination"
                className="mb-3 block text-sm text-slate-400"
              >
                First destination
              </label>
              <DestinationSearch
                id="primary-comparison-destination"
                ariaLabel="Search for your first destination"
                placeholder="Search or select a destination"
                showSuggestionsOnFocus
                onSelect={({ slug }) => selectPrimary(slug)}
              />
            </div>
          </section>
        ) : isPending ? (
          <p
            role="status"
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-sm text-slate-400"
          >
            Loading destination…
          </p>
        ) : isError ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
            <h2 className="text-lg font-semibold">
              Unable to load destination
            </h2>
            <p role="alert" className="mt-2 text-sm text-slate-400">
              {error.message}
            </p>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
              className="mt-5 min-h-11 cursor-pointer rounded-lg border border-sky-300/60 px-4 py-2 text-sm text-sky-200 hover:bg-sky-300/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 disabled:cursor-wait disabled:opacity-50"
            >
              {isFetching ? "Retrying…" : "Try again"}
            </button>
          </section>
        ) : (
          <section
            aria-label="Destination comparison"
            className="relative rounded-2xl border border-slate-700/80 bg-slate-900/40"
          >
            {(secondarySlug || showThirdColumn) && (
              <button
                ref={thirdTabRef}
                type="button"
                aria-label={showThirdColumn ? "Remove third column" : "Add third destination"}
                title={showThirdColumn ? "Remove third column" : "Add third destination"}
                aria-expanded={showThirdColumn}
                aria-controls={showThirdColumn ? "third-comparison-column" : undefined}
                onClick={() => {
                  if (showThirdColumn) selectThird(null);
                  else setOpenThirdFor(slug);
                }}
                className="absolute -top-4 right-4 z-10 flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-sky-200 transition-colors hover:border-sky-300/60 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={`size-5 shrink-0 ${showThirdColumn ? "rotate-45" : ""}`}
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}
            <div className={`grid ${desktopColumns}`}>
              <div
                aria-hidden="true"
                className="hidden border-r border-slate-700/80 lg:block"
              />
              <div className="min-w-0 border-b border-slate-700/80 lg:border-r lg:border-b-0">
                <ComparisonDestinationSlot
                  key={slug}
                  id="primary-comparison-destination"
                  label="First destination"
                  excludeSlugs={primaryExclusions}
                  selectedSlug={slug}
                  query={primaryQuery}
                  onSelect={({ slug }) => selectPrimary(slug)}
                />
              </div>
              <div className={`min-w-0 border-slate-700/80 ${showThirdColumn ? "border-b lg:border-r lg:border-b-0" : ""}`}>
                <ComparisonDestinationSlot
                  key={`${slug}:${secondarySlug ?? "empty"}`}
                  id="second-comparison-destination"
                  label="Second destination"
                  excludeSlugs={secondaryExclusions}
                  selectedSlug={secondarySlug}
                  query={secondaryQuery}
                  onSelect={({ slug }) => selectSecondary(slug)}
                  onRemove={() => selectSecondary(null)}
                />
              </div>
              {showThirdColumn && (
                <div id="third-comparison-column" className="min-w-0">
                  <ComparisonDestinationSlot
                    key={`${slug}:${thirdSlug ?? "empty"}`}
                    id="third-comparison-destination"
                    label="Third destination"
                    excludeSlugs={thirdExclusions}
                    selectedSlug={thirdSlug}
                    query={thirdQuery}
                    onSelect={({ slug }) => selectThird(slug)}
                    onRemove={() => selectThird(null)}
                  />
                </div>
              )}
            </div>
            {selectedCategories.length > 0 && (
              <ComparisonCategoryRows
                selected={selectedCategories}
                categories={categoryOptions}
                columns={columns}
                desktopColumns={desktopColumns}
                onRemove={(category) =>
                  selectCategories(
                    selectedCategories.filter((slug) => slug !== category),
                  )
                }
              />
            )}
            <div className={`grid border-t border-slate-700/80 lg:min-h-20 ${desktopColumns}`}>
              <div className="flex items-center border-b border-slate-700/80 px-6 py-3 lg:border-r lg:border-b-0">
                <ComparisonCategoryPicker
                  categories={categoryOptions}
                  selected={selectedCategories}
                  onSelect={(category) =>
                    selectCategories([...selectedCategories, category])
                  }
                />
              </div>
              <div className={`flex flex-col items-center justify-center gap-2 px-6 py-3 text-center ${showThirdColumn ? "lg:col-span-3" : "lg:col-span-2"}`}>
                {selectedCategories.length === 0 ? (
                  <>
                    <h2 className="text-sm font-medium">
                      No categories selected
                    </h2>
                    <p className="max-w-sm text-sm leading-relaxed text-slate-400">
                      Selected categories will appear here for comparison.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Scores out of 10</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
