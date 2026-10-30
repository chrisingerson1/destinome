import { useState } from "react";

import { CategorySelector } from "./CategorySelector";
import { ScoreLegend } from "./ScoreLegend";
import { MatchingDestinations, type MatchingDestinationsProps } from "./MatchingDestinations";
import type { ScoreFilter } from "../../lib/discovery";

type OpenPanel = "category" | "legend" | "matching" | null;

type MapControlsProps = {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  formatCategoryLabel: (category: string) => string;
  minimumScore: number | null;
  onMinimumScoreChange: (score: number | null) => void;
  activeFilters: readonly ScoreFilter[];
  onClearFilter: (slug: string) => void;
  onClearFilters: () => void;
  matchingResults: MatchingDestinationsProps;
  loading?: boolean;
  error?: boolean;
};

export const MapControls = ({
  categories,
  selectedCategory,
  onCategoryChange,
  formatCategoryLabel,
  minimumScore,
  onMinimumScoreChange,
  activeFilters,
  onClearFilter,
  onClearFilters,
  matchingResults,
  loading = false,
  error = false,
}: MapControlsProps) => {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  const togglePanel = (panel: Exclude<OpenPanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  const handleCategoryChange = (category: string) => {
    onCategoryChange(category);
    setOpenPanel(null);
  };

  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-20 flex max-h-[calc(100%-7rem)] w-[280px] max-w-[calc(100vw-40px)] flex-col gap-3 overflow-y-auto overscroll-contain">
      <div className="pointer-events-auto w-full">
        <CategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          expanded={openPanel === "category"}
          loading={loading}
          error={error}
          onToggle={() => togglePanel("category")}
          onCategoryChange={handleCategoryChange}
          formatCategoryLabel={formatCategoryLabel}
        />
      </div>

      <div className="pointer-events-auto w-full">
        <ScoreLegend
          expanded={openPanel === "legend"}
          onToggle={() => togglePanel("legend")}
          minimumScore={minimumScore}
          onMinimumScoreChange={onMinimumScoreChange}
          activeFilters={activeFilters}
          formatCategoryLabel={formatCategoryLabel}
          onClearFilter={onClearFilter}
          onClearFilters={onClearFilters}
        />
      </div>

      <div className="pointer-events-auto w-full">
        <MatchingDestinations
          {...matchingResults}
          expanded={openPanel === "matching"}
          onToggle={() => togglePanel("matching")}
        />
      </div>
    </div>
  );
};
