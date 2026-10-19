import { useState } from "react";
import { createPortal } from "react-dom";

import { SCORE_TIERS, SCORE_LEGEND_ORDER } from "../../config/scoreTiers";

type ScoreLegendProps = {
  expanded: boolean;
  onToggle: () => void;
};

type TooltipState = {
  label: string;
  x: number;
  y: number;
};

export const ScoreLegend = ({ expanded, onToggle }: ScoreLegendProps) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

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
          <span className="text-sm font-semibold text-white">Score Legend</span>

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
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
            expanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex gap-1.5 px-4 pb-4 pt-1">
              {tiers.map((tierKey) => {
                const tier = SCORE_TIERS[tierKey];

                return (
                  <div
                    key={tierKey}
                    tabIndex={expanded ? 0 : -1}
                    role="img"
                    aria-label={tier.label}
                    onMouseEnter={(event) =>
                      showTooltip(event.currentTarget, tier.label)
                    }
                    onMouseLeave={hideTooltip}
                    onFocus={(event) =>
                      showTooltip(event.currentTarget, tier.label)
                    }
                    onBlur={hideTooltip}
                    className="h-2 flex-1 cursor-default rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    style={{
                      backgroundColor: tier.color,
                    }}
                  />
                );
              })}
            </div>
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
