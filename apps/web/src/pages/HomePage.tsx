import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

const scoreDimensions = [
  "Food",
  "Culture",
  "Nature",
  "Nightlife",
  "Walkability",
  "Budget",
];

const globeMarkers = [
  { position: "top-[25%] left-[31%]", color: "#579BFF" },
  { position: "top-[44%] left-[63%]", color: "#25C6A6" },
  { position: "top-[62%] left-[38%]", color: "#F2A34A" },
];

let globeModulePromise: Promise<unknown> | undefined;

const preloadGlobe = () => {
  globeModulePromise ??= import("../components/map/Globe");
  return globeModulePromise;
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    const preloadTimeout = window.setTimeout(() => {
      void preloadGlobe();
    }, 250);

    return () => window.clearTimeout(preloadTimeout);
  }, []);

  useEffect(() => {
    if (!isLaunching) return;

    let cancelled = false;
    let timeout: number;

    const minimumTransition = new Promise<void>((resolve) => {
      timeout = window.setTimeout(resolve, 400);
    });

    void Promise.all([
      preloadGlobe(),
      minimumTransition,
    ]).then(() => {
      if (!cancelled) {
        navigate("/map", { state: { fromHome: true } });
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [isLaunching, navigate]);

  const viewGlobe = () => {
    if (isLaunching) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate("/map");
      return;
    }

    setIsLaunching(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05080f] text-slate-100">
      <div
        className={`home-stars pointer-events-none inset-0 ${
          isLaunching
            ? "home-launch-stars fixed z-50 bg-[#02050a]"
            : "absolute"
        }`}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-300/30 to-transparent" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center px-6 py-6 md:px-10">
        <Link
          to="/"
          className="text-base font-bold tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
          aria-label="Destinome home"
        >
          Destinome
        </Link>

      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-14 px-6 py-16 md:px-10 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:py-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-sky-300 uppercase">
            <span className="h-px w-9 bg-sky-300/70" />
            The world, measured differently
          </p>

          <h1 className="mt-9 text-5xl leading-[1.04] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
            Find your place in the world.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
            Compare destinations by the things that shape a trip: food,
            culture, nature, nightlife, cost, accessibility, and more.
          </p>

          <button
            type="button"
            onClick={viewGlobe}
            onPointerEnter={() => void preloadGlobe()}
            onFocus={() => void preloadGlobe()}
            disabled={isLaunching}
            className="mt-10 inline-flex cursor-pointer items-center gap-8 border border-sky-300/60 bg-sky-300 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:border-sky-200 hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 disabled:cursor-wait"
          >
            View globe
            <span aria-hidden="true">→</span>
          </button>

          <div className="mt-14 flex flex-wrap gap-x-3 gap-y-2 text-xs tracking-[0.12em] text-slate-600 uppercase">
            {scoreDimensions.map((dimension, index) => (
              <span key={dimension} className="flex items-center gap-3">
                {index > 0 && <span aria-hidden="true">/</span>}
                {dimension}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-lg items-center justify-center lg:max-w-none">
          <div className="absolute size-[88%] rounded-full border border-slate-700/40" />
          <div className="absolute size-[112%] rotate-12 rounded-[50%] border border-slate-700/30" />

          <div className="home-globe relative aspect-square w-[72%] overflow-hidden rounded-full border border-sky-200/20 bg-[#0b1628]">
            <div className="absolute inset-[12%] rounded-full border border-sky-100/10" />
            <div className="absolute inset-[29%] rounded-full border border-sky-100/10" />
            <div className="absolute top-1/2 left-0 h-px w-full bg-sky-100/10" />
            <div className="absolute top-[19%] left-[-10%] h-[62%] w-[120%] rounded-[50%] border border-sky-100/10" />
            <div className="absolute top-0 left-1/2 h-full w-px bg-sky-100/10" />

            <div className="absolute top-[24%] left-[16%] h-[29%] w-[38%] -rotate-12 rounded-[48%_52%_58%_42%] bg-slate-500/20" />
            <div className="absolute right-[15%] bottom-[18%] h-[39%] w-[30%] rotate-12 rounded-[58%_42%_47%_53%] bg-slate-500/15" />

            {globeMarkers.map((marker) => (
              <span
                key={marker.position}
                className={`absolute ${marker.position} size-3 rounded-full border-2 border-[#0b1628]`}
                style={{ backgroundColor: marker.color }}
              />
            ))}
          </div>

          <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.18em] whitespace-nowrap text-slate-600 uppercase">
            0° 00′ 00″ N&nbsp;&nbsp; 0° 00′ 00″ E
          </p>
        </div>
      </section>

    </main>
  );
};
