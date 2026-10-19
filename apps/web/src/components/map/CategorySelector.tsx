type CategorySelectorProps = {
  categories: string[];
  selectedCategory: string;
  expanded: boolean;
  loading: boolean;
  error: boolean;
  onToggle: () => void;
  onCategoryChange: (category: string) => void;
  formatCategoryLabel: (category: string) => string;
};

export const CategorySelector = ({
  categories,
  selectedCategory,
  expanded,
  loading,
  error,
  onToggle,
  onCategoryChange,
  formatCategoryLabel,
}: CategorySelectorProps) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/90 text-white shadow-xl backdrop-blur-md">
      {/* Accordion header */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="globe-category-options"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">
            Explore by category
          </span>

          <span className="truncate text-sm font-semibold text-white">
            {formatCategoryLabel(selectedCategory)}
          </span>
        </div>

        <span
          aria-hidden="true"
          className="shrink-0 text-2xl font-light leading-none text-slate-400"
        >
          {expanded ? "-" : "+"}
        </span>
      </button>

      {/* Expandable category list */}
      <div
        id="globe-category-options"
        aria-hidden={!expanded}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-700/70">
            {error ? (
              <p className="px-4 py-3 text-xs text-red-300">
                Unable to load scoring categories.
              </p>
            ) : loading ? (
              <p className="px-4 py-3 text-xs text-slate-400">
                Loading categories...
              </p>
            ) : (
              <div className="max-h-[min(45vh,320px)] overflow-y-auto p-2">
                {categories.map((category) => {
                  const selected = category === selectedCategory;

                  return (
                    <button
                      key={category}
                      type="button"
                      tabIndex={expanded ? 0 : -1}
                      aria-pressed={selected}
                      onClick={() => onCategoryChange(category)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        selected
                          ? "bg-slate-800 font-semibold text-white"
                          : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                      }`}
                    >
                      <span>{formatCategoryLabel(category)}</span>

                      {selected && (
                        <span
                          aria-hidden="true"
                          className="font-semibold text-blue-400"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
