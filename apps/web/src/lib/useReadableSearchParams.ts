import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { discoverySearch } from "./discovery";

export function useReadableSearchParams() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const readableSearch = discoverySearch(params);

  useEffect(() => {
    if (location.search === readableSearch) return;
    void navigate({ search: readableSearch, hash: location.hash }, {
      replace: true,
      preventScrollReset: true,
      state: location.state,
    });
  }, [location.search, location.hash, location.state, readableSearch, navigate]);

  return params;
}
