import type { DestinationScore } from "../../types";

type DestinationScoresProps = {
  scores: DestinationScore[];
};

const scoreGroups = [
  {
    title: "Culture & City Life",
    slugs: [
      "food",
      "culture",
      "museums",
      "architecture",
      "sightseeing",
      "shopping",
      "nightlife",
      "photographic-hotspots",
      "gambling",
    ],
  },
  {
    title: "Nature & Adventure",
    slugs: ["nature", "scenery", "wildlife", "hiking", "camping", "cycling"],
  },
  {
    title: "Water & Sports",
    slugs: ["beaches", "boating", "diving", "ski", "winter-sports", "golf"],
  },
  {
    title: "Travel Practicalities",
    slugs: [
      "budget",
      "safety",
      "public-transit",
      "disability-friendly",
      "kid-friendly",
      "lgbt-friendly",
      "women-friendly",
    ],
  },
  {
    title: "Travel Style",
    slugs: ["activities", "romantic", "wellness"],
  },
];

const ScoreCard = ({ score }: { score: DestinationScore }) => {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-200">{score.name}</span>
        <span className="text-lg font-semibold text-white">
          {score.score.toFixed(1)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={score.name}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={score.score}
        className="h-1.5 overflow-hidden rounded-full bg-slate-700"
      >
        <div
          className="h-full rounded-full bg-sky-400 transition-all"
          style={{ width: `${score.score * 10}%` }}
        />
      </div>
    </div>
  );
};

export const DestinationScores = ({ scores }: DestinationScoresProps) => {
  const groups = scoreGroups
    .map((group) => ({
      ...group,
      scores: scores
        .filter((score) => group.slugs.includes(score.slug))
        .sort((a, b) => b.score - a.score),
    }))
    .filter((group) => group.scores.length > 0);

  return (
    <section>
      <h2 className="mb-8 text-2xl font-semibold">Destination Scores</h2>
      {groups.length === 0 ? (
        <p className="text-slate-400">No destination scores available yet</p>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-lg font-medium text-slate-200">
                {group.title}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.scores.map((score) => (
                  <ScoreCard key={score.slug} score={score} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
