import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useReadableSearchParams } from "./useReadableSearchParams";
import {
  discoverySearch,
  readDiscoveryState,
  updateDiscoveryParams,
  type DiscoveryState,
} from "./discovery";

export function useDiscoveryState() {
  const params = useReadableSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const rawScores = params.get("scores") ?? "";
  // Camera changes must not invalidate filtering or dismiss an open pin popup.
  const filters = useMemo(
    () =>
      readDiscoveryState(new URLSearchParams({ scores: rawScores })).filters,
    [rawScores],
  );
  const discovery = useMemo(
    () => ({ ...readDiscoveryState(params), filters }),
    [params, filters],
  );
  const updateDiscovery = useCallback(
    (patch: Partial<DiscoveryState>, replace = false) => {
      // setSearchParams always re-encodes ':' and ',', so navigate with the
      // formatted search string instead.
      void navigate({
        search: discoverySearch(updateDiscoveryParams(params, patch)),
        hash: location.hash,
      }, {
        replace,
        preventScrollReset: true,
        state: location.state,
      });
    },
    [params, navigate, location.hash, location.state],
  );

  return { discovery, params, updateDiscovery };
}
