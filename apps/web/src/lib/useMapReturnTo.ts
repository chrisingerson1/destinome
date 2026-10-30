import { useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import { mapReturnStore, parseMapReturnParams } from "./mapReturn";

export function useMapReturnTo() {
  const location = useLocation();
  const saved = useSyncExternalStore(mapReturnStore.subscribe, mapReturnStore.getSnapshot, () => "/map");
  // Old links have a usable target even before the migration effect runs.
  const { legacyMapUrl } = parseMapReturnParams(new URLSearchParams(location.search));
  return legacyMapUrl ?? saved;
}
