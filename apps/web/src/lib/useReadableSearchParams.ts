import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { discoverySearch } from "./discovery";
import { mapReturnStore, parseMapReturnParams } from "./mapReturn";

export function useReadableSearchParams() {
  const [originalParams] = useSearchParams();
  const { params, legacyMapUrl } = useMemo(() => parseMapReturnParams(originalParams), [originalParams]);
  const location = useLocation();
  const navigate = useNavigate();
  const readableSearch = discoverySearch(params);

  useEffect(() => {
    if (legacyMapUrl) mapReturnStore.save(legacyMapUrl);
    if (location.pathname === "/map") {
      mapReturnStore.save(`/map${readableSearch}${location.hash}`);
    }
    if (location.search === readableSearch) return;
    void navigate({ search: readableSearch, hash: location.hash }, {
      replace: true,
      preventScrollReset: true,
      state: location.state,
    });
  }, [location.pathname, location.search, location.hash, location.state, readableSearch, legacyMapUrl, navigate]);

  return params;
}
