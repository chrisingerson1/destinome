import { discoverySearch } from "./discovery.ts";

export function comparisonHref(destinationSlug: string): string {
  const params = new URLSearchParams({ destination: destinationSlug });
  return `/compare${discoverySearch(params)}`;
}

export function getSecondaryDestinationSlug(params: URLSearchParams): string | undefined {
  const primary = params.get("destination")?.trim();
  const secondary = params.get("with")?.trim();
  return primary && secondary && primary !== secondary ? secondary : undefined;
}

export function updateSecondaryDestination(params: URLSearchParams, slug: string | null): URLSearchParams {
  const next = new URLSearchParams(params);
  const candidate = slug?.trim();
  const primary = next.get("destination")?.trim();
  next.delete("with");
  if (primary && candidate && candidate !== primary) next.set("with", candidate);
  return next;
}
