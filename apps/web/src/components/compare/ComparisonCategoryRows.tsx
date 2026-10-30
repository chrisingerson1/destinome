import { getScoreTier, SCORE_TIERS } from "../../config/scoreTiers";
import { scoreEmojis } from "../../config/scoreEmojis";
import { getComparisonScore, type ComparisonCategory } from "../../lib/comparison";
import type { DestinationDetail } from "../../types/destination";

export type ComparisonColumn = {
  id: string;
  label: string;
  destination?: DestinationDetail;
  state: "empty" | "loading" | "error" | "ready";
};

type ComparisonCategoryRowsProps = {
  selected: readonly string[];
  categories: readonly ComparisonCategory[];
  columns: readonly ComparisonColumn[];
  desktopColumns: string;
  onRemove: (slug: string) => void;
};

const ScoreValue = ({ score }: { score: number | null }) => score === null ? (
  <span className="text-sm text-slate-400">Unrated</span>
) : (
  <div className="flex w-full items-center gap-4">
    <div aria-hidden="true" className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-700">
      <div
        className="h-full rounded-full"
        style={{ width: `${score * 10}%`, backgroundColor: SCORE_TIERS[getScoreTier(score)].color }}
      />
    </div>
    <span className="w-9 shrink-0 text-right text-base font-semibold tabular-nums text-slate-100">
      {score.toFixed(1)}
      <span className="sr-only"> out of 10</span>
    </span>
  </div>
);

export const ComparisonCategoryRows = ({
  selected,
  categories,
  columns,
  desktopColumns,
  onRemove,
}: ComparisonCategoryRowsProps) => {
  const names = new Map(categories.map(({ slug, name }) => [slug, name]));

  return (
    <div role="table" aria-label="Category score comparison">
      <div role="row" className="sr-only">
        <span role="columnheader">Category</span>
        {columns.map(({ id, label, destination }) => (
          <span key={id} role="columnheader">{destination?.name ?? label}</span>
        ))}
      </div>
      {selected.map((slug) => {
        const name = names.get(slug) ?? slug.split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        return (
          <div key={slug} role="row" className={`grid grid-cols-1 border-t border-slate-700/80 lg:min-h-14 ${columns.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} ${desktopColumns}`}>
            <div role="rowheader" className="col-span-full flex min-w-0 items-center justify-between gap-3 px-6 py-2 lg:col-span-1 lg:border-r lg:border-slate-700/80">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <span aria-hidden="true" className="shrink-0">{scoreEmojis[slug] ?? "✨"}</span>
                <span className="min-w-0 break-words">{name}</span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(slug)}
                aria-label={`Remove ${name} category`}
                className="flex min-h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm text-lg text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                ×
              </button>
            </div>
            {columns.map(({ id, label, destination, state }) => (
              <div key={id} role="cell" className="flex min-w-0 flex-col justify-center border-t border-slate-700/80 px-6 py-2 sm:border-t-0 sm:border-r sm:last:border-r-0 lg:px-8">
                <p aria-hidden="true" className="mb-2 text-xs text-slate-400 lg:hidden">{destination?.name ?? label}</p>
                {state === "empty" ? (
                  <span className="text-sm text-slate-400">Select a destination</span>
                ) : state === "loading" ? (
                  <span className="text-sm text-slate-400">Loading…</span>
                ) : state === "error" ? (
                  <span className="text-sm text-slate-400">Unable to load</span>
                ) : (
                  <ScoreValue score={getComparisonScore(destination?.scores, slug)} />
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
