import { useQuery } from "@tanstack/react-query";
import { Route, Routes } from "react-router";

import { DestinationPage } from "./pages/DestinationPage";

type HealthResponse = {
  status: string;
};

function HomePage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: async (): Promise<HealthResponse> => {
      const response = await fetch("/api/health");

      if (!response.ok) {
        throw new Error("Failed to connect to API");
      }

      return response.json();
    },
  });

  return (
    <main>
      <h1>Destinome</h1>
      <p>Your next destination starts here.</p>

      {isPending && <p>Connecting to API...</p>}
      {isError && <p>API connection failed.</p>}
      {data && <p>API Status: {data.status}</p>}
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/destination/:slug" element={<DestinationPage />} />
    </Routes>
  );
}
