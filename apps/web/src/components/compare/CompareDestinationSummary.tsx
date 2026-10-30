import type { ReactNode } from "react";
import { getScoreTier, SCORE_TIERS } from "../../config/scoreTiers";
import type { DestinationDetail } from "../../types/destination";

type CompareDestinationSummaryProps = {
  destination: DestinationDetail;
  label: string;
  actions?: ReactNode;
};

export const CompareDestinationSummary = ({ destination, label, actions }: CompareDestinationSummaryProps) => {
  const overallScore = destination.scores.find(({ slug }) => slug === "overall")?.score ?? null;
  const tier = SCORE_TIERS[getScoreTier(overallScore)];

  return (
    <article aria-label={label}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 text-2xl font-semibold break-words">{destination.name}</h2>
        {actions}
      </div>
      <p className="mt-2 text-sm text-slate-400">
        {[
          destination.parentDestination?.name,
          destination.adminArea1,
          destination.country.name,
        ].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-7 text-4xl font-semibold tabular-nums">
        {overallScore === null ? "—" : overallScore.toFixed(2)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="text-slate-400">Overall score</span>
        <span className="inline-flex items-center gap-2 text-slate-300">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
          {tier.label}
        </span>
      </div>
    </article>
  );
};
