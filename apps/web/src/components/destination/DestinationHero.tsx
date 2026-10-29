import { Link } from "react-router";

import type { DestinationDetail } from "../../types/destination";

type DestinationHeroProps = {
  destination: DestinationDetail;
  backTo?: string;
};

export const DestinationHero = ({
  destination,
  backTo = "/map",
}: DestinationHeroProps) => {
  const overallScore = destination.scores.find(
    (score) => score.slug === "overall",
  );

  const location = [destination.adminArea1, destination.country.name]
    .filter(Boolean)
    .join(", ");

  return (
    <header className="relative min-h-100 overflow-hidden rounded-3xl bg-slate-900">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-800 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.15),transparent_50%)]" />

      {/* Content */}
      <div className="relative flex min-h-100 flex-col justify-between p-8 md:p-12">
        <Link
          to={backTo}
          className="w-fit text-sm text-slate-300 transition hover:text-white"
        >
          ← Back to map
        </Link>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-medium tracking-widest text-slate-300 uppercase">
              {location}
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-white md:text-7xl">
              {destination.name}
            </h1>
            {destination.climate && (
              <p className="mt-4 text-sm text-slate-300">
                {destination.climate.name}
                {" • "}
                {destination.climate.code}
              </p>
            )}
          </div>
          {overallScore && (
            <div className="flex items-baseline gap-2 md:flex-col md:items-end md:gap-0">
              <div>
                <span className="text-5xl font-semibold text-white">
                  {overallScore.score.toFixed(2)}
                </span>
                <span className="ml-1 text-lg text-slate-400">/10</span>
              </div>
              <p className="text-sm text-slate-300">Overall Score</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
