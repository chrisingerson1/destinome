import { useState } from "react";

import { SCORE_TIERS, SCORE_LEGEND_ORDER } from "../../config/scoreTiers";

const LEGEND_BASE_SIZE = 8;

export const ScoreLegend = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-20">
      <div className="pointer-events-auto w-64 overflow-hidden rounded-xl border border-white/15 bg-slate-950/90 text-white shadow-xl backdrop-blur-md">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((previous) => !previous)}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/10"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: SCORE_TIERS.elite.color,
              }}
            />
            Overall Score
          </span>

          <span
            aria-hidden="true"
            className="text-lg leading-none text-slate-400"
          >
            {isOpen ? "-" : "+"}
          </span>
        </button>

        {isOpen && (
          <div className="border-t border-white/10 px-4 py-3">
            <div className="space-y-2.5">
              {SCORE_LEGEND_ORDER.map((key) => {
                const tier = SCORE_TIERS[key];
                const size = LEGEND_BASE_SIZE * tier.sizeMultiplier;

                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                      <span
                        className="shrink-0 rounded-full"
                        style={{
                          width: size,
                          height: size,
                          backgroundColor: tier.color,
                        }}
                      />
                    </div>

                    <span className="flex-1 text-sm text-slate-200">
                      {tier.label}
                    </span>

                    <span className="text-xs tabular-nums text-slate-400">
                      {tier.range}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-400">
              Higher-rated destinations have larger pins.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
