import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router";

import { getDestination } from "../lib/destinations";
import { destinationHref, discoverySearch } from "../lib/discovery";
import {
  getComparisonCategories,
  getComparisonCategoryOptions,
  getSecondaryDestinationSlug,
  updateComparisonCategories,
  updateSecondaryDestination,
} from "../lib/comparison";
import { useReadableSearchParams } from "../lib/useReadableSearchParams";
import { useMapReturnTo } from "../lib/useMapReturnTo";
import { CompareDestinationSummary } from "../components/compare/CompareDestinationSummary";
import { ComparisonDestinationSlot } from "../components/compare/ComparisonDestinationSlot";
import { ComparisonCategoryPicker } from "../components/compare/ComparisonCategoryPicker";
import { ComparisonCategoryRows } from "../components/compare/ComparisonCategoryRows";

export const ComparePage = () => {
  const params = useReadableSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const slug = params.get("destination")?.trim() || undefined;
  const secondarySlug = getSecondaryDestinationSlug(params);
  const selectedCategories = getComparisonCategories(params);
  const returnTo = useMapReturnTo();
  const {
    data: destination,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["destination", slug],
    queryFn: ({ signal }) => {
      if (!slug) throw new Error("Missing destination slug");
      return getDestination(slug, signal);
    },
    enabled: Boolean(slug),
  });
  const secondaryQuery = useQuery({
    queryKey: ["destination", secondarySlug],
    queryFn: ({ signal }) => {
      if (!secondarySlug) throw new Error("Missing destination slug");
      return getDestination(secondarySlug, signal);
    },
    enabled: Boolean(secondarySlug),
  });
  const categoryOptions = useMemo(
    () =>
      getComparisonCategoryOptions(
        destination?.scores,
        secondaryQuery.data?.scores,
      ),
    [destination?.scores, secondaryQuery.data?.scores],
  );

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
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              Explore a destination and select Compare on its details page.
            </p>
            <Link
              to={returnTo}
              className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-sky-300/60 px-4 py-2 text-sm font-medium text-sky-200 transition-colors hover:bg-sky-300/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
            >
              Explore destinations →
            </Link>
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
            className="rounded-2xl border border-slate-700/80 bg-slate-900/40"
          >
            <div className="grid md:grid-cols-[minmax(140px,0.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div
                aria-hidden="true"
                className="hidden border-r border-slate-700/80 md:block"
              />
              <div className="min-w-0 border-b border-slate-700/80 p-6 md:border-r md:border-b-0 md:p-8">
                <CompareDestinationSummary
                  destination={destination}
                  label="Selected destination"
                />
              </div>
              <ComparisonDestinationSlot
                key={`${slug}:${secondarySlug ?? "empty"}`}
                primarySlug={slug}
                selectedSlug={secondarySlug}
                query={secondaryQuery}
                onSelect={({ slug }) => selectSecondary(slug)}
                onRemove={() => selectSecondary(null)}
              />
            </div>
            {selectedCategories.length > 0 && (
              <ComparisonCategoryRows
                selected={selectedCategories}
                categories={categoryOptions}
                primary={destination}
                secondary={secondaryQuery.data}
                secondaryState={
                  !secondarySlug
                    ? "empty"
                    : secondaryQuery.isError
                      ? "error"
                      : secondaryQuery.isPending
                        ? "loading"
                        : "ready"
                }
                onRemove={(category) =>
                  selectCategories(
                    selectedCategories.filter((slug) => slug !== category),
                  )
                }
              />
            )}
            <div className="grid border-t border-slate-700/80 md:min-h-20 md:grid-cols-[minmax(140px,0.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex items-center border-b border-slate-700/80 px-6 py-3 md:border-r md:border-b-0">
                <ComparisonCategoryPicker
                  categories={categoryOptions}
                  selected={selectedCategories}
                  onSelect={(category) =>
                    selectCategories([...selectedCategories, category])
                  }
                />
              </div>
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-3 text-center md:col-span-2">
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
