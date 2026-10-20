import { useState } from "react";

import { CategorySelector } from "./CategorySelector";
import { ScoreLegend } from "./ScoreLegend";

type OpenPanel = "category" | "legend" | null;

type MapControlsProps = {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  formatCategoryLabel: (category: string) => string;
  minimumScore: number | null;
  onMinimumScoreChange: (score: number | null) => void;
  totalCount: number;
  matchingCount: number;
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
  totalCount,
  matchingCount,
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
    <div className="pointer-events-none absolute bottom-5 left-5 z-20 flex w-[280px] max-w-[calc(100vw-40px)] flex-col gap-3">
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
          totalCount={totalCount}
          matchingCount={matchingCount}
        />
      </div>
    </div>
  );
};
