import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { DestinationSearchResult } from "../../lib/destinations";
import type { DestinationDetail } from "../../types/destination";
import { DestinationSearch } from "../DestinationSearch";
import { CompareDestinationSummary } from "./CompareDestinationSummary";

type ComparisonDestinationSlotProps = {
  primarySlug: string;
  selectedSlug?: string;
  query: UseQueryResult<DestinationDetail, Error>;
  onSelect: (destination: DestinationSearchResult) => void;
  onRemove: () => void;
};

const actionClass = "cursor-pointer rounded-sm text-xs text-slate-400 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300";

export const ComparisonDestinationSlot = ({ primarySlug, selectedSlug, query, onSelect, onRemove }: ComparisonDestinationSlotProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data, isPending, isError, error, isFetching, refetch } = query;

  const actions = (
    <div className="flex h-8 shrink-0 gap-3">
      <button type="button" onClick={() => setIsEditing(true)} className={actionClass}>Change</button>
      <button type="button" onClick={onRemove} className={actionClass}>Remove</button>
    </div>
  );

  return (
    <div className="min-w-0 p-6 md:p-8">
      {!selectedSlug || isEditing ? (
        <>
          <label htmlFor="comparison-destination" className="mb-3 block text-sm text-slate-400">Compare with</label>
          <DestinationSearch
            id="comparison-destination"
            ariaLabel="Search for a destination to compare"
            placeholder="Search or select a destination"
            showSuggestionsOnFocus
            excludeSlug={primarySlug}
            onSelect={(destination) => {
              setIsEditing(false);
              onSelect(destination);
            }}
          />
          {selectedSlug && <button type="button" onClick={() => setIsEditing(false)} className={`mt-3 min-h-9 ${actionClass}`}>Cancel</button>}
        </>
      ) : isError ? (
        <>
          {actions}
          <p role="alert" className="mt-3 text-sm text-slate-400">{error.message}</p>
          <button
            type="button"
            onClick={() => { void refetch(); }}
            disabled={isFetching}
            className={`${actionClass} mt-3 min-h-9 disabled:cursor-wait disabled:opacity-50`}
          >
            {isFetching ? "Retrying…" : "Try again"}
          </button>
        </>
      ) : isPending ? (
        <>
          {actions}
          <p role="status" className="mt-3 text-sm text-slate-400">Loading comparison destination…</p>
        </>
      ) : (
        <CompareDestinationSummary destination={data} label="Comparison destination" actions={actions} />
      )}
    </div>
  );
};
