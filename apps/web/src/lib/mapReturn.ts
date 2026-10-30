export const MAP_RETURN_STORAGE_KEY = "destinome:map-return";

type MapReturnStorage = Pick<Storage, "getItem" | "setItem">;

function isMapUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value === "/map" || value.startsWith("/map?") || value.startsWith("/map#"))
  );
}

export function createMapReturnStore(
  storage: () => MapReturnStorage | undefined = () =>
    typeof window === "undefined" ? undefined : window.sessionStorage,
) {
  let current: string | undefined;
  const listeners = new Set<() => void>();

  const getSnapshot = () => {
    if (current !== undefined) return current;
    try {
      const saved = storage()?.getItem(MAP_RETURN_STORAGE_KEY);
      current = isMapUrl(saved) ? saved : "/map";
    } catch {
      current = "/map";
    }
    return current;
  };

  const save = (value: string) => {
    if (!isMapUrl(value)) return;
    const previous = getSnapshot();
    current = value;
    try {
      storage()?.setItem(MAP_RETURN_STORAGE_KEY, value);
    } catch {
      // Navigation still works in memory when browser storage is unavailable.
    }
    if (value !== previous) listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { getSnapshot, save, subscribe };
}

export const mapReturnStore = createMapReturnStore();

export function parseMapReturnParams(params: URLSearchParams) {
  const legacy = params.get("returnTo");
  const cleanParams = new URLSearchParams(params);
  cleanParams.delete("returnTo");
  return {
    params: cleanParams,
    legacyMapUrl: isMapUrl(legacy) ? legacy : undefined,
  };
}
