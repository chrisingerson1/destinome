import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";

import { getDestination } from "../lib/destinations";

export const DestinationPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["destination", slug],
    queryFn: ({ signal }) => {
      if (!slug) {
        throw new Error("Missing destination slug");
      }

      return getDestination(slug, signal);
    },
    enabled: Boolean(slug),
  });

  if (isPending) {
    return <p>Loading destination...</p>;
  }

  if (isError) {
    return <p>{error.message}</p>;
  }

  const destination = data;

  const overallScore = destination.scores.find(
    (score) => score.slug === "overall",
  );

  const topScores = destination.scores
    .filter((score) => score.slug !== "overall")
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <main>
      <Link to="/">Back to Destinome</Link>
      <header>
        <p>
          {[destination.adminArea1, destination.country.name]
            .filter(Boolean)
            .join(", ")}
        </p>
        <h1>{destination.name}</h1>
        {overallScore && (
          <p>Overall Score: {overallScore.score.toFixed(1)}/10</p>
        )}
      </header>
      <section>
        <h2>About {destination.name}</h2>
        {destination.climate && (
          <p>
            Climate: {destination.climate.name} ({destination.climate.code})
          </p>
        )}
      </section>
      <section>
        <h2>Destination Scores</h2>
        {topScores.map((score) => (
          <div key={score.slug}>
            <p>
              {score.name}: {score.score.toFixed(1)}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
};
