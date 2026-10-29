import { useState } from "react";
import { createPortal } from "react-dom";

import { SCORE_TIERS, SCORE_LEGEND_ORDER, getScoreTier } from "../../config/scoreTiers";
import type { ScoreFilter } from "../../lib/discovery";

type ScoreLegendProps = {
  expanded: boolean;
  onToggle: () => void;
  minimumScore: number | null;
  onMinimumScoreChange: (score: number | null) => void;
  activeFilters: readonly ScoreFilter[];
  formatCategoryLabel: (category: string) => string;
  onClearFilter: (slug: string) => void;
  onClearFilters: () => void;
};

type TooltipState = {
  label: string;
  x: number;
  y: number;
};

const SCORE_THRESHOLDS: (number | null)[] = [9.5, 9, 8, 7, 6, 0];

export const ScoreLegend = ({
  expanded,
  onToggle,
  minimumScore,
  onMinimumScoreChange,
  activeFilters,
  formatCategoryLabel,
  onClearFilter,
  onClearFilters,
}: ScoreLegendProps) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const activeFilterCount = activeFilters.length;

  const tiers = SCORE_LEGEND_ORDER.filter((tierKey) => tierKey !== "unrated");

  const showTooltip = (element: HTMLElement, label: string) => {
    const rect = element.getBoundingClientRect();

    setTooltip({
      label,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/90 text-white shadow-xl backdrop-blur-md">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="globe-score-legend"
          onClick={() => {
            hideTooltip();
            onToggle();
          }}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-white">
            Score Legend & Filtering
          </span>

          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div
          id="globe-score-legend"
          aria-hidden={!expanded}
          inert={!expanded}
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
            expanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex gap-1.5 px-4 pb-4 pt-1">
              {tiers.map((tierKey, index) => {
                const tier = SCORE_TIERS[tierKey];
                const threshold = SCORE_THRESHOLDS[index];

                const selected =
                  minimumScore !== null && minimumScore === threshold;

                return (
                  <button
                    key={tierKey}
                    type="button"
                    aria-pressed={selected}
                    aria-label={
                      threshold === 0
                        ? "Show only rated destinations"
                        : `Show destinations scoring ${threshold?.toFixed(1)} or higher`
                    }
                    onClick={() => {
                      hideTooltip();

                      onMinimumScoreChange(selected ? null : threshold);
                    }}
                    onMouseEnter={(event) =>
                      showTooltip(event.currentTarget, tier.label)
                    }
                    onMouseLeave={hideTooltip}
                    onFocus={(event) =>
                      showTooltip(event.currentTarget, tier.label)
                    }
                    onBlur={hideTooltip}
                    className={`h-2 flex-1 cursor-pointer rounded-full transition-all duration-200 hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
                      selected
                        ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950"
                        : ""
                    }`}
                    style={{
                      backgroundColor: tier.color,
                    }}
                  />
                );
              })}
            </div>

            {activeFilterCount > 0 && (
              <section className="border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <button
                    type="button"
                    aria-expanded={filtersExpanded}
                    aria-controls="globe-active-filters"
                    onClick={() => setFiltersExpanded((current) => !current)}
                    className="flex min-w-0 cursor-pointer items-center gap-2 rounded-sm text-left hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                  >
                    <span>
                      {activeFilterCount} category {activeFilterCount === 1 ? "filter" : "filters"} active
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`size-3.5 shrink-0 transition-transform ${filtersExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="shrink-0 cursor-pointer rounded-sm hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                  >
                    Clear all
                  </button>
                </div>
                <ul
                  id="globe-active-filters"
                  hidden={!filtersExpanded}
                  className="max-h-48 divide-y divide-white/10 overflow-y-auto overscroll-contain border-t border-white/10"
                >
                  {activeFilters.map(({ slug, min }) => {
                    const tier = SCORE_TIERS[getScoreTier(min)];
                    return (
                      <li key={slug} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="min-w-0">
                          <span className="block text-slate-100">{formatCategoryLabel(slug)}</span>
                          <span className="mt-1 flex items-center gap-2 text-slate-400">
                            <span
                              aria-hidden="true"
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: tier.color }}
                            />
                            {tier.label}
                          </span>
                        </span>
                        <button
                          type="button"
                          aria-label={`Clear ${formatCategoryLabel(slug)} filter`}
                          onClick={() => onClearFilter(slug)}
                          className="shrink-0 cursor-pointer rounded-sm text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                        >
                          Clear
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Tooltip rendered outside the accordion */}
      {expanded &&
        tooltip &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-[#334155] bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-[#f8fafc] shadow-xl"
            style={{
              left: tooltip.x,
              top: tooltip.y,
            }}
          >
            {tooltip.label}
          </div>,
          document.body,
        )}
    </>
  );
};
