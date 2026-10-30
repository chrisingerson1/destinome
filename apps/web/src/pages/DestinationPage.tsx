import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

import { getDestination } from "../lib/destinations";
import { discoveryReturnTo } from "../lib/discovery";
import { useReadableSearchParams } from "../lib/useReadableSearchParams";

import {
  DestinationHero,
  DestinationScores,
  DestinationWeather,
  ExploreNeighborhoods,
} from "../components/destination";

export const DestinationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const params = useReadableSearchParams();
  const returnTo = discoveryReturnTo(params);

  const {
    data: destination,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["destination", slug],
    queryFn: ({ signal }) => {
      if (!slug) {
        throw new Error("Missing destination slug");
      }

      return getDestination(slug, signal);
    },
    enabled: Boolean(slug),
  });

  useEffect(() => {
    document.title = destination?.name
      ? `Destinome | ${destination?.name}`
      : "Destinome";
    return () => {
      document.title = "Destinome";
    };
  }, [destination?.name]);

  if (isPending || isError) {
    return (
      <main className="min-h-[calc(100dvh-var(--navbar-height))] bg-slate-950 p-8 text-white">
        <Link to={returnTo} className="text-sm text-slate-300">
          ← Back to map
        </Link>
        <p className="mt-6">
          {isError ? error.message : "Loading destination..."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-var(--navbar-height))] bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <DestinationHero destination={destination} backTo={returnTo} />

        <div className="mt-12 grid gap-12 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-12 lg:col-span-2">
            <DestinationScores scores={destination.scores} />
            <DestinationWeather monthlyMetrics={destination.monthlyMetrics} />
          </div>

          {/* Sidebar */}
          <aside>
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-6">
                <h2 className="mb-5 text-lg font-semibold">At a Glance</h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-400">Country</p>
                    <p className="mt-1">{destination.country.name}</p>
                  </div>
                  {destination.adminArea1 && (
                    <div>
                      <p className="text-slate-400">Region</p>
                      <p className="mt-1">{destination.adminArea1}</p>
                    </div>
                  )}
                  {destination.climate && (
                    <div>
                      <p className="text-slate-400">Climate Classification</p>
                      <p className="mt-1">{destination.climate.name}</p>
                    </div>
                  )}
                </div>
              </div>
              <ExploreNeighborhoods
                neighborhoods={destination.neighborhoods}
                returnTo={returnTo}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};
