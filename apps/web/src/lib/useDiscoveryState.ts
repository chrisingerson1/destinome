import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  discoverySearch,
  readDiscoveryState,
  updateDiscoveryParams,
  type DiscoveryState,
} from "./discovery";

export function useDiscoveryState() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const readableSearch = discoverySearch(params);

  // Older encoded links still load normally, then become readable in place.
  useEffect(() => {
    if (location.search === readableSearch) return;
    void navigate({ search: readableSearch, hash: location.hash }, {
      replace: true,
      preventScrollReset: true,
      state: location.state,
    });
  }, [location.search, location.hash, location.state, readableSearch, navigate]);
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
