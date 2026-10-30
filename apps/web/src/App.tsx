import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";

import { DestinationPage } from "./pages/DestinationPage";
import { HomePage } from "./pages/HomePage";
import { Navbar } from "./components/Navbar";
import { useGlobeLaunch } from "./lib/useGlobeLaunch";

const Globe = lazy(() =>
  import("./components/map/Globe").then((module) => ({
    default: module.Globe,
  })),
);

export default function App() {
  const { isLaunching, launchGlobe } = useGlobeLaunch();

  return (
    <div className="min-h-dvh bg-[#05080f]">
      <Navbar onHomeExplore={launchGlobe} isLaunching={isLaunching} />
      <Routes>
        <Route
          path="/"
          element={<HomePage isLaunching={isLaunching} onViewGlobe={launchGlobe} />}
        />
        <Route
          path="/map"
          element={
            <main className="h-[calc(100dvh-var(--navbar-height))] w-full bg-black">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Loading map...
                  </div>
                }
              >
                <Globe />
              </Suspense>
            </main>
          }
        />
        <Route path="/destination/:slug" element={<DestinationPage />} />
      </Routes>
    </div>
  );
}
