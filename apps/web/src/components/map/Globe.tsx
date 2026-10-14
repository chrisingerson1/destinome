import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  Map as MapLibreMap,
  type MapMouseEvent,
  NavigationControl,
  Popup,
  setWorkerUrl,
} from "maplibre-gl";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  getMapDestinations,
  type DestinationSearchResult,
} from "../../lib/destinations";
import type { MapDestination } from "../../types/destination";

import {
  createPushpinLayer,
  type InteractivePushpinLayer,
} from "./createPushpinLayer";
import { DestinationSearch } from "./DestinationSearch";
import { ScoreLegend } from "./ScoreLegend";

setWorkerUrl(workerUrl);

const apiKey = import.meta.env.VITE_MAPTILER_KEY;

export const Globe = () => {
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const destinationsBySlug = useRef(new Map<string, MapDestination>());

  const [scoresBySlug, setScoresBySlug] = useState(
    new Map<string, number | null>(),
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !apiKey) return;

    const map = new MapLibreMap({
      container,
      style: `https://api.maptiler.com/maps/hybrid-v4/style.json?key=${apiKey}`,
      center: [0, 35],
      zoom: 2,
      minZoom: 0,
      maxZoom: 18,
      canvasContextAttributes: {
        antialias: true,
      },
    });
    mapRef.current = map;

    let pinLayer: InteractivePushpinLayer | null = null;
    let hoverPopup: Popup | null = null;
    let previewPopup: Popup | null = null;
    let hoveredId: number | null = null;

    const handleMouseMove = (event: MapMouseEvent) => {
      const pin = pinLayer?.pick(event.point) ?? null;

      map.getCanvas().style.cursor = pin ? "pointer" : "";

      if ((pin?.id ?? null) === hoveredId) return;
      hoveredId = pin?.id ?? null;
      hoverPopup?.remove();
      hoverPopup = null;

      if (!pin) return;

      const label = document.createElement("span");
      label.textContent = pin.name;

      hoverPopup = new Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        className: "destinome-hover",
      })
        .setLngLat([pin.longitude, pin.latitude])
        .setDOMContent(label)
        .addTo(map);

      hoverPopup.getElement().style.pointerEvents = "none";
    };

    const handleClick = (event: MapMouseEvent) => {
      const pin = pinLayer?.pick(event.point) ?? null;

      previewPopup?.remove();
      previewPopup = null;

      if (!pin) return;

      hoverPopup?.remove();
      hoverPopup = null;
      hoveredId = null;

      const content = document.createElement("div");
      content.className = "min-w-52 space-y-3";

      const title = document.createElement("h3");
      title.className = "pr-4 text-lg font-semibold";
      title.textContent = pin.name;

      const score = document.createElement("p");
      score.className = "text-sm text-slate-300";
      score.textContent =
        pin.overallScore === null
          ? "Overall score unavailable"
          : `Overall Score: ${pin.overallScore.toFixed(2)}/10`;

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "cursor-pointer text-sm font-medium text-sky-400 hover:text-sky-300";
      button.textContent = "View destination →";
      button.addEventListener("click", () => {
        navigate(`/destination/${pin.slug}`);
      });

      content.append(title, score, button);

      previewPopup = new Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 20,
        maxWidth: "320px",
        className: "destinome-preview",
      })
        .setLngLat([pin.longitude, pin.latitude])
        .setDOMContent(content)
        .addTo(map);
    };

    map.on("mousemove", handleMouseMove);
    map.on("click", handleClick);
    map.on("style.load", () => {
      map.setProjection({ type: "globe" });
    });

    map.addControl(
      new NavigationControl({
        showCompass: false,
      }),
      "top-right",
    );

    const controller = new AbortController();

    const loadDestinations = async () => {
      try {
        const destinations = await getMapDestinations(controller.signal);
        if (controller.signal.aborted) return;

        destinationsBySlug.current = new Map(
          destinations.map((destination) => [destination.slug, destination]),
        );

        setScoresBySlug(
          new Map(
            destinations.map((destination) => [
              destination.slug,
              destination.overallScore,
            ]),
          ),
        );

        console.log(`Loaded ${destinations.length} destinations.`);
        if (destinations.length === 0) return;

        pinLayer = createPushpinLayer(destinations);
        map.addLayer(pinLayer);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load map destinations:", error);
        }
      }
    };

    map.on("load", () => void loadDestinations());

    return () => {
      controller.abort();

      map.off("mousemove", handleMouseMove);
      map.off("click", handleClick);

      hoverPopup?.remove();
      previewPopup?.remove();

      mapRef.current = null;
      destinationsBySlug.current.clear();

      map.remove();
    };
  }, [navigate]);

  const handleSearchSelect = (result: DestinationSearchResult) => {
    const map = mapRef.current;
    const destination = destinationsBySlug.current.get(result.slug);

    if (!map || !destination) return;

    map.flyTo({
      center: [destination.longitude, destination.latitude],
      zoom: 12,
      speed: 1.2,
      essential: true,
    });
  };

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-white">
        MapTiler API key is missing.
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      <div ref={containerRef} className="h-dvh w-full bg-black" />
      <DestinationSearch
        onSelect={handleSearchSelect}
        scoresBySlug={scoresBySlug}
      />
      <ScoreLegend />
    </div>
  );
};
