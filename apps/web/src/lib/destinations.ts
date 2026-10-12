import type { DestinationDetail, MapDestination } from "../types";

export async function getDestination(
  slug: string,
  signal?: AbortSignal,
): Promise<DestinationDetail> {
  const response = await fetch(`/api/destination/${encodeURIComponent(slug)}`, {
    signal,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Destination not found");
    }

    throw new Error("Failed to fetch destination");
  }

  const result: { data: DestinationDetail } = await response.json();
  return result.data;
}

export const getMapDestinations = async (
  signal?: AbortSignal,
): Promise<MapDestination[]> => {
  const response = await fetch(`/api/destinations/map`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to load map destinations");
  }

  const result: { data: MapDestination[] } = await response.json();
  return result.data;
};
