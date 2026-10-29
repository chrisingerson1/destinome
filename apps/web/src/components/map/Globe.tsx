import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";

import {
  Map as MapLibreMap,
  Popup,
  NavigationControl,
  setWorkerUrl,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  getMapDestinations,
  getMapDestinationScores,
} from "../../lib/destinations";

import type { MapDestination } from "../../types/destination";
import {
  DEFAULT_MAP_VIEW,
  destinationHref,
  discoveryHref,
  mapViewKey,
  matchesScoreFilters,
  rankedMapDestinations,
  updateDiscoveryParams,
  type MapView,
} from "../../lib/discovery";
import { useDiscoveryState } from "../../lib/useDiscoveryState";

import {
  createPushpinLayer,
  type InteractivePushpinLayer,
} from "./createPushpinLayer";

import { DestinationSearch } from "./DestinationSearch";
import { MapControls } from "./MapControls";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs?v=2");

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

const MAP_STYLE = `https://api.maptiler.com/maps/hybrid-v4/style.json?key=${MAPTILER_KEY}`;

const HOME_TRANSITION_START_ZOOM = -1.5;

const CITY_SEARCH_ZOOM = 10;
const NEIGHBORHOOD_SEARCH_ZOOM = 12.5;

const SCORE_CACHE_TIME = 1000 * 60 * 60;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const getCategoryLabel = (category: string): string => {
  if (category === "overall") {
    return "Overall Score";
  }

  return category
    .split(/[-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getScoreLabel = (score: number | null): string =>
  score === null ? "Unrated" : score.toFixed(2);

const readMapView = (map: MapLibreMap): MapView => {
  const center = map.getCenter().wrap();
  return {
    longitude: center.lng,
    latitude: center.lat,
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
};

// -----------------------------------------------------------------------------
// Globe
// -----------------------------------------------------------------------------

export const Globe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [animateFromHome] = useState(() =>
    Boolean((location.state as { fromHome?: boolean } | null)?.fromHome),
  );
  const { discovery, params, updateDiscovery } = useDiscoveryState();
  const { category: selectedCategory, filters } = discovery;
  const minimumScore =
    filters.find(({ slug }) => slug === selectedCategory)?.min ?? null;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [mapDestinations, setMapDestinations] = useState<MapDestination[]>([]);
  const [destinationsLoaded, setDestinationsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(() =>
    MAPTILER_KEY ? null : "Missing VITE_MAPTILER_KEY",
  );

  // ---------------------------------------------------------------------------
  // References
  // ---------------------------------------------------------------------------

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pinLayerRef = useRef<InteractivePushpinLayer | null>(null);
  const hoverPopupRef = useRef<Popup | null>(null);
  const detailPopupRef = useRef<Popup | null>(null);
  const destinationsBySlugRef = useRef(new Map<string, MapDestination>());
  const matchingIdsRef = useRef<ReadonlySet<number> | null>(null);
  const initialViewRef = useRef(discovery.view);
  const urlViewKey = discovery.view ? mapViewKey(discovery.view) : "";
  const lastUrlViewKeyRef = useRef(urlViewKey);
  const restoringViewRef = useRef(false);

  const saveMapView = useEffectEvent((map: MapLibreMap) => {
    if (!restoringViewRef.current) {
      const view = readMapView(map);
      if (mapViewKey(view) !== urlViewKey) updateDiscovery({ view }, true);
    }
  });

  const openDestination = useEffectEvent((slug: string, map: MapLibreMap) => {
    const view = readMapView(map);
    const returnTo = discoveryHref(updateDiscoveryParams(params, { view }));
    // Save the exact camera position even if the traveler opens a moving pin.
    updateDiscovery({ view }, true);
    navigate(destinationHref(slug, returnTo));
  });

  // ---------------------------------------------------------------------------
  // Category scores
  // ---------------------------------------------------------------------------

  const {
    data: destinationScores,
    isPending: scoresLoading,
    isError: scoresError,
    refetch: refetchScores,
  } = useQuery({
    queryKey: ["destinations", "map", "scores"],
    queryFn: ({ signal }) => getMapDestinationScores(signal),
    staleTime: SCORE_CACHE_TIME,
    gcTime: SCORE_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  const availableCategories = useMemo(() => {
    const categories = new Set<string>(["overall"]);

    for (const destination of destinationScores ?? []) {
      Object.keys(destination.scores).forEach((category) => {
        categories.add(category);
      });
    }

    return [
      "overall",
      ...[...categories].filter((category) => category !== "overall").sort(),
    ];
  }, [destinationScores]);

  const activeScoreMap = useMemo(() => {
    const scores = new Map<number, number | null>();

    for (const destination of destinationScores ?? []) {
      scores.set(destination.id, destination.scores[selectedCategory] ?? null);
    }

    return scores;
  }, [destinationScores, selectedCategory]);

  const matchingDestinationIds = useMemo(() => {
    if (filters.length === 0) return null;
    const scoresById = new Map(
      destinationScores?.map(({ id, scores }) => [id, scores]),
    );
    return new Set(
      mapDestinations
        .filter((destination) => {
          const scores = scoresById.get(destination.id);
          return matchesScoreFilters(filters, {
            ...scores,
            overall: scores?.overall ?? destination.overallScore,
          });
        })
        .map(({ id }) => id),
    );
  }, [mapDestinations, destinationScores, filters]);
  const matchingDestinations = useMemo(
    () => rankedMapDestinations(mapDestinations, matchingDestinationIds),
    [mapDestinations, matchingDestinationIds],
  );

  useEffect(() => {
    matchingIdsRef.current = matchingDestinationIds;
    pinLayerRef.current?.setMatchingDestinationIds(matchingDestinationIds);
    hoverPopupRef.current?.remove();
    hoverPopupRef.current = null;
    detailPopupRef.current?.remove();
    detailPopupRef.current = null;
  }, [matchingDestinationIds]);

  const parentNamesBySlug = useMemo(() => {
    const destinationsById = new Map(
      mapDestinations.map((destination) => [destination.id, destination]),
    );

    const parents = new Map<string, string>();

    for (const destination of mapDestinations) {
      if (destination.parentDestinationId == null) {
        continue;
      }

      const parent = destinationsById.get(destination.parentDestinationId);
      if (parent) {
        parents.set(destination.slug, parent.name);
      }
    }

    return parents;
  }, [mapDestinations]);

  const scoresBySlug = useMemo(() => {
    return new Map<string, number | null>(
      mapDestinations.map((destination) => {
        const score = activeScoreMap.get(destination.id);

        return [
          destination.slug,
          selectedCategory === "overall"
            ? (score ?? destination.overallScore)
            : (score ?? null),
        ];
      }),
    );
  }, [mapDestinations, activeScoreMap, selectedCategory]);

  // ---------------------------------------------------------------------------
  // Keep the latest category data available to MapLibre callbacks
  // ---------------------------------------------------------------------------

  const selectedCategoryRef = useRef(selectedCategory);
  const activeScoreMapRef = useRef(activeScoreMap);
  const scoresLoadedRef = useRef(false);

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
    activeScoreMapRef.current = activeScoreMap;
    scoresLoadedRef.current = destinationScores !== undefined;

    if (!destinationScores) return;

    // Update the existing layer, never create another.
    pinLayerRef.current?.setScoreCategory(selectedCategory, activeScoreMap);
  }, [selectedCategory, activeScoreMap, destinationScores]);

  // ---------------------------------------------------------------------------
  // MapLibre initialization
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    if (!MAPTILER_KEY) return;

    const controller = new AbortController();

    let disposed = false;
    const initialView = initialViewRef.current ?? DEFAULT_MAP_VIEW;
    const playHomeAnimation =
      animateFromHome && initialViewRef.current === null;

    const map = new MapLibreMap({
      container,
      style: MAP_STYLE,
      center: [initialView.longitude, initialView.latitude],
      zoom: playHomeAnimation ? HOME_TRANSITION_START_ZOOM : initialView.zoom,
      pitch: initialView.pitch,
      bearing: initialView.bearing,
    });

    mapRef.current = map;
    const onMoveEnd = () => saveMapView(map);
    map.on("moveend", onMoveEnd);

    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "top-right",
    );

    // -------------------------------------------------------------------------
    // Globe projection
    // -------------------------------------------------------------------------

    map.on("style.load", () => {
      if (disposed) return;

      map.setProjection({ type: "globe" });
    });

    if (playHomeAnimation) {
      map.once("load", () => {
        if (disposed) return;

        map.easeTo({
          center: [initialView.longitude, initialView.latitude],
          zoom: initialView.zoom,
          duration: 1800,
          easing: (progress) => 1 - Math.pow(1 - progress, 3),
          essential: true,
        });
      });
    }

    // -------------------------------------------------------------------------
    // Popup helpers
    // -------------------------------------------------------------------------

    const clearHoverPopup = () => {
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
    };

    const clearDetailPopup = () => {
      detailPopupRef.current?.remove();
      detailPopupRef.current = null;
    };

    const getDestinationScore = (
      destination: MapDestination,
    ): number | null => {
      const category = selectedCategoryRef.current;

      if (category === "overall") {
        return (
          activeScoreMapRef.current.get(destination.id) ??
          destination.overallScore
        );
      }

      if (!scoresLoadedRef.current) {
        return null;
      }

      return activeScoreMapRef.current.get(destination.id) ?? null;
    };

    // -------------------------------------------------------------------------
    // Destination preview
    // -------------------------------------------------------------------------

    const showDestinationPopup = (destination: MapDestination) => {
      clearHoverPopup();
      clearDetailPopup();

      const category = selectedCategoryRef.current;
      const score = getDestinationScore(destination);

      const content = document.createElement("div");
      content.className = "destinome-popup-body";

      // Destination name
      const title = document.createElement("h3");
      title.className = "destinome-popup-title";
      title.textContent = destination.name;

      // Score row
      const scoreContainer = document.createElement("div");
      scoreContainer.className = "destinome-popup-score";

      const scoreLabel = document.createElement("span");
      scoreLabel.className = "destinome-popup-score-label";
      scoreLabel.textContent = getCategoryLabel(category);

      const scoreValue = document.createElement("span");
      scoreValue.className = "destinome-popup-score-value";
      scoreValue.textContent = getScoreLabel(score);

      scoreContainer.append(scoreLabel, scoreValue);

      // Explore button
      const exploreButton = document.createElement("button");
      exploreButton.type = "button";
      exploreButton.className = "destinome-popup-button";
      exploreButton.textContent = "Explore Destination →";

      exploreButton.addEventListener("click", () => {
        openDestination(destination.slug, map);
      });

      content.append(title, scoreContainer, exploreButton);

      const popup = new Popup({
        className: "destinome-preview",
        closeButton: true,
        closeOnClick: false,
        offset: 16,
        maxWidth: "320px",
      })
        .setLngLat([destination.longitude, destination.latitude])
        .setDOMContent(content)
        .addTo(map);

      detailPopupRef.current = popup;

      popup.on("close", () => {
        if (detailPopupRef.current === popup) {
          detailPopupRef.current = null;
        }
      });
    };

    // -------------------------------------------------------------------------
    // Hover and click interactions
    // -------------------------------------------------------------------------

    let hoveredDestinationId: number | null = null;

    const onMouseMove = (event: MapMouseEvent) => {
      const layer = pinLayerRef.current;

      if (!layer) return;

      const destination = layer.pick(event.point);
      map.getCanvas().style.cursor = destination ? "pointer" : "";

      if (!destination) {
        hoveredDestinationId = null;
        clearHoverPopup();
        return;
      }

      if (hoveredDestinationId === destination.id) {
        return;
      }

      hoveredDestinationId = destination.id;

      clearHoverPopup();

      if (detailPopupRef.current) {
        return;
      }

      const content = document.createElement("div");
      content.className = "destinome-hover-content";

      const location = document.createElement("div");
      location.className = "destinome-hover-location";

      const name = document.createElement("span");
      name.className = "destinome-hover-name";
      name.textContent = destination.name;

      const country = document.createElement("span");
      country.className = "destinome-hover-country";
      country.textContent = destination.country;

      location.append(name, country);

      const score = document.createElement("span");
      score.className = "destinome-hover-score";
      score.textContent = getScoreLabel(getDestinationScore(destination));

      content.append(location, score);

      const popup = new Popup({
        className: "destinome-hover",
        closeButton: false,
        closeOnClick: false,
        offset: 20,
        maxWidth: "none",
      })
        .setLngLat([destination.longitude, destination.latitude])
        .setDOMContent(content)
        .addTo(map);

      popup.getElement().style.pointerEvents = "none";

      hoverPopupRef.current = popup;
    };

    const onMouseLeave = () => {
      hoveredDestinationId = null;

      map.getCanvas().style.cursor = "";

      clearHoverPopup();
    };

    const onClick = (event: MapMouseEvent) => {
      const layer = pinLayerRef.current;

      if (!layer) return;

      const destination = layer.pick(event.point);
      if (!destination) {
        hoveredDestinationId = null;

        clearHoverPopup();
        clearDetailPopup();

        return;
      }

      hoveredDestinationId = null;

      const destinationZoom =
        destination.parentDestinationId !== null
          ? NEIGHBORHOOD_SEARCH_ZOOM
          : CITY_SEARCH_ZOOM;

      map.flyTo({
        center: [destination.longitude, destination.latitude],
        zoom: Math.max(map.getZoom(), destinationZoom),
        speed: 1.2,
        essential: true,
      });

      showDestinationPopup(destination);
    };

    map.on("mousemove", onMouseMove);
    map.on("click", onClick);

    map.getCanvas().addEventListener("mouseleave", onMouseLeave);

    // -------------------------------------------------------------------------
    // Load destinations and create ONE pushpin layer
    // -------------------------------------------------------------------------

    const loadDestinations = async () => {
      try {
        const destinations = await getMapDestinations(controller.signal);

        if (disposed || controller.signal.aborted) {
          return;
        }

        destinationsBySlugRef.current = new Map(
          destinations.map((destination) => [destination.slug, destination]),
        );

        setMapDestinations(destinations);
        setDestinationsLoaded(true);

        // Only create the layer once.
        const layer = createPushpinLayer(destinations);
        map.addLayer(layer);

        // The handlers and scoring effect access this same instance.
        pinLayerRef.current = layer;
        layer.setMatchingDestinationIds(matchingIdsRef.current);

        // Category scores may have loaded before map destinations.
        if (scoresLoadedRef.current) {
          layer.setScoreCategory(
            selectedCategoryRef.current,
            activeScoreMapRef.current,
          );
        }

        map.triggerRepaint();
      } catch (error) {
        if (disposed || controller.signal.aborted) {
          return;
        }

        console.error("Failed to load map destinations:", error);

        setMapError("Unable to load map destinations.");
      }
    };

    map.once("load", () => {
      if (disposed) return;

      if (playHomeAnimation) {
        map.once("moveend", () => {
          if (!disposed) {
            void loadDestinations();
          }
        });
        return;
      }

      void loadDestinations();
    });

    map.on("error", (event) => {
      console.error("MapLibre error:", event.error);
    });

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------

    return () => {
      disposed = true;
      controller.abort();

      map.off("mousemove", onMouseMove);
      map.off("click", onClick);
      map.off("moveend", onMoveEnd);

      map.getCanvas().removeEventListener("mouseleave", onMouseLeave);

      clearHoverPopup();
      clearDetailPopup();

      pinLayerRef.current = null;
      mapRef.current = null;

      destinationsBySlugRef.current.clear();

      map.remove();
    };
  }, [animateFromHome]);

  // Back/Forward changes the camera without creating a new history entry.
  useEffect(() => {
    if (urlViewKey === lastUrlViewKeyRef.current) return;
    lastUrlViewKeyRef.current = urlViewKey;
    const map = mapRef.current;
    if (!map) return;
    const view = discovery.view ?? DEFAULT_MAP_VIEW;
    if (mapViewKey(readMapView(map)) === mapViewKey(view)) return;
    restoringViewRef.current = true;
    try {
      map.stop();
      map.jumpTo({
        center: [view.longitude, view.latitude],
        zoom: view.zoom,
        bearing: view.bearing,
        pitch: view.pitch,
      });
    } finally {
      restoringViewRef.current = false;
    }
  }, [urlViewKey, discovery.view]);

  // ---------------------------------------------------------------------------
  // Destination search
  // ---------------------------------------------------------------------------

  const handleDestinationSelect = (result: Pick<MapDestination, "slug">) => {
    const map = mapRef.current;

    const destination = destinationsBySlugRef.current.get(result.slug);

    if (!map || !destination) return;

    const zoom =
      destination.parentDestinationId !== null
        ? NEIGHBORHOOD_SEARCH_ZOOM
        : CITY_SEARCH_ZOOM;

    hoverPopupRef.current?.remove();
    hoverPopupRef.current = null;

    detailPopupRef.current?.remove();
    detailPopupRef.current = null;

    map.flyTo({
      center: [destination.longitude, destination.latitude],
      zoom,
      speed: 1.2,
      essential: true,
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={`relative h-dvh w-full overflow-hidden bg-black ${
        animateFromHome ? "destinome-map-entering" : ""
      }`}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      />

      <DestinationSearch
        onSelect={handleDestinationSelect}
        scoresBySlug={scoresBySlug}
        parentNamesBySlug={parentNamesBySlug}
      />

      <MapControls
        categories={availableCategories}
        selectedCategory={selectedCategory}
        onCategoryChange={(category) => updateDiscovery({ category })}
        formatCategoryLabel={getCategoryLabel}
        minimumScore={minimumScore}
        onMinimumScoreChange={(min) =>
          updateDiscovery({
            filters: [
              ...filters.filter(({ slug }) => slug !== selectedCategory),
              ...(min === null ? [] : [{ slug: selectedCategory, min }]),
            ],
          })
        }
        activeFilters={filters}
        onClearFilter={(slug) => updateDiscovery({
          filters: filters.filter((filter) => filter.slug !== slug),
        })}
        onClearFilters={() => updateDiscovery({ filters: [] })}
        matchingResults={{
          destinations: matchingDestinations,
          parentNamesBySlug,
          onSelect: handleDestinationSelect,
          loading: scoresLoading || !destinationsLoaded,
          error: scoresError,
          onRetry: () => { void refetchScores(); },
        }}
        loading={scoresLoading}
        error={scoresError}
      />

      {mapError && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-6">
          <div className="max-w-sm rounded-xl border border-red-400/20 bg-slate-950 p-5 text-center text-white shadow-xl">
            <h2 className="text-base font-semibold">Unable to load globe</h2>

            <p className="mt-2 text-sm text-slate-400">{mapError}</p>
          </div>
        </div>
      )}
    </div>
  );
};
