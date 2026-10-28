import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";

import { DestinationPage } from "./pages/DestinationPage";
import { HomePage } from "./pages/HomePage";

const Globe = lazy(() =>
  import("./components/map/Globe").then((module) => ({
    default: module.Globe,
  })),
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/map"
        element={
          <main className="h-dvh w-full bg-black">
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
  );
}
