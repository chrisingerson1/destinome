import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

let globeModulePromise: Promise<unknown> | undefined;

export const preloadGlobe = () => {
  globeModulePromise ??= import("../components/map/Globe");
  return globeModulePromise;
};

export function useGlobeLaunch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    if (!isLaunching || pathname !== "/") return;

    let cancelled = false;
    let timeout: number;
    const minimumTransition = new Promise<void>((resolve) => {
      timeout = window.setTimeout(resolve, 400);
    });

    void Promise.all([preloadGlobe(), minimumTransition]).then(() => {
      if (!cancelled) {
        navigate("/map", { state: { fromHome: true } });
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      // This state lives above the routes, so reset it when leaving home too.
      setIsLaunching(false);
    };
  }, [isLaunching, navigate, pathname]);

  const launchGlobe = () => {
    if (isLaunching) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate("/map");
      return;
    }

    setIsLaunching(true);
  };

  return { isLaunching, launchGlobe };
}
