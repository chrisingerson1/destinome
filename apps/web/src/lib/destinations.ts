import type {
  CountrySummary,
  DestinationDetail,
  MapDestination,
  MapDestinationScores,
} from "../types";

export type DestinationSearchResult = {
  id: number;
  name: string;
  slug: string;
  country: CountrySummary;
  adminArea?: string | null;
  parentDestination?: { id: number; name: string; slug: string } | null;
};

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

export const getMapDestinationScores = async (
  signal?: AbortSignal,
): Promise<MapDestinationScores[]> => {
  const response = await fetch(`/api/destinations/map/scores`, { signal });
  if (!response.ok) {
    throw new Error("Unable to load destination scores.");
  }

  const result: { data: MapDestinationScores[] } = await response.json();
  return result.data;
};

export const searchDestinations = async (
  search: string,
  signal?: AbortSignal,
): Promise<DestinationSearchResult[]> => {
  const result = await searchDestinationsPage(search, 1, signal);
  return result.data;
};

export type DestinationSearchPage = {
  data: DestinationSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const searchDestinationsPage = async (
  search: string,
  page: number,
  signal?: AbortSignal,
): Promise<DestinationSearchPage> => {
  const params = new URLSearchParams({
    search,
    page: String(page),
    limit: "8",
  });

  const response = await fetch(`/api/destinations?${params}`, { signal });
  if (!response.ok) {
    throw new Error("Unable to search destinations");
  }

  return response.json();
};
