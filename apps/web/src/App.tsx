import { Route, Routes } from "react-router";

import { Globe } from "./components/map/Globe";
import { DestinationPage } from "./pages/DestinationPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="h-dvh w-full bg-black">
            <Globe />
          </main>
        }
      />
      <Route path="/destination/:slug" element={<DestinationPage />} />
    </Routes>
  );
}
