import { useEffect, useId, useRef, useState } from "react";
import type { ComparisonCategory } from "../../lib/comparison";

type ComparisonCategoryPickerProps = {
  categories: readonly ComparisonCategory[];
  selected: readonly string[];
  onSelect: (slug: string) => void;
};

export const ComparisonCategoryPicker = ({
  categories,
  selected,
  onSelect,
}: ComparisonCategoryPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const available = categories.filter(({ slug }) => !selected.includes(slug));
  const matches = available.filter(({ name }) =>
    name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!isOpen) return;
    searchRef.current?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
        onClick={() => {
          setSearch("");
          setIsOpen((current) => !current);
        }}
        className="min-h-11 cursor-pointer rounded-lg border border-sky-300/60 px-4 py-2 text-sm text-sky-200 transition-colors hover:bg-sky-300/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
      >
        + Add category
      </button>
      {isOpen && (
        <div
          id={id}
          role="dialog"
          aria-label="Add comparison category"
          className="absolute top-full left-0 z-30 mt-2 w-[min(280px,calc(100vw-4rem))] rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-xl"
        >
          <input
            ref={searchRef}
            type="search"
            autoComplete="off"
            aria-label="Search categories"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories…"
            className="mb-2 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-sky-300"
          />
          <ul className="max-h-64 overflow-y-auto overscroll-contain">
            {matches.map(({ slug, name }) => (
              <li key={slug}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(slug);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className="flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-300"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
          {matches.length === 0 && (
            <p role="status" className="px-3 py-3 text-sm text-slate-400">
              {categories.length === 0
                ? "No category scores available for these destinations."
                : available.length === 0
                  ? "All available categories have been added."
                  : "No categories match your search."}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
