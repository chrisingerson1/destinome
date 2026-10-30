import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { DestinationSearchResult } from "../../lib/destinations";
import type { DestinationDetail } from "../../types/destination";
import { DestinationSearch } from "../DestinationSearch";
import { CompareDestinationSummary } from "./CompareDestinationSummary";

type ComparisonDestinationSlotProps = {
  id: string;
  label: string;
  excludeSlugs: readonly string[];
  selectedSlug?: string;
  query: UseQueryResult<DestinationDetail, Error>;
  onSelect: (destination: DestinationSearchResult) => void;
  onRemove?: () => void;
};

const actionClass = "cursor-pointer rounded-sm text-xs text-slate-400 hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300";

export const ComparisonDestinationSlot = ({ id, label, excludeSlugs, selectedSlug, query, onSelect, onRemove }: ComparisonDestinationSlotProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data, isPending, isError, error, isFetching, refetch } = query;

  const actions = (
    <div className="flex h-8 shrink-0 gap-3">
      <button type="button" aria-label={`Change ${label.toLowerCase()}`} onClick={() => setIsEditing(true)} className={actionClass}>Change</button>
      {onRemove && <button type="button" aria-label={`Remove ${label.toLowerCase()}`} onClick={onRemove} className={actionClass}>Remove</button>}
    </div>
  );

  return (
    <div className="min-w-0 p-6 md:p-8">
      {!selectedSlug || isEditing ? (
        <>
          <label htmlFor={id} className="mb-3 block text-sm text-slate-400">{label}</label>
          <DestinationSearch
            id={id}
            ariaLabel={`Search for ${label.toLowerCase()}`}
            placeholder="Search or select a destination"
            showSuggestionsOnFocus
            excludeSlugs={excludeSlugs}
            onSelect={(destination) => {
              setIsEditing(false);
              onSelect(destination);
            }}
          />
          {selectedSlug && <button type="button" aria-label={`Cancel changing ${label.toLowerCase()}`} onClick={() => setIsEditing(false)} className={`mt-3 min-h-9 ${actionClass}`}>Cancel</button>}
        </>
      ) : isError ? (
        <>
          {actions}
          <p role="alert" className="mt-3 text-sm text-slate-400">{label}: {error.message}</p>
          <button
            type="button"
            aria-label={`Retry ${label.toLowerCase()}`}
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
          <p role="status" className="mt-3 text-sm text-slate-400">Loading {label.toLowerCase()}…</p>
        </>
      ) : (
        <CompareDestinationSummary destination={data} label={label} actions={actions} />
      )}
    </div>
  );
};
