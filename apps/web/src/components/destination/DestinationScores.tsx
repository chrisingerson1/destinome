import { useId, useState } from "react";

import { getScoreTier, SCORE_TIERS } from "../../config/scoreTiers";
import type { DestinationScore } from "../../types";

type DestinationScoresProps = {
  scores: DestinationScore[];
};

const SUMMARY_SCORE_COUNT = 6;

const scoreEmojis: Record<string, string> = {
  activities: "🎯",
  architecture: "🏛️",
  beaches: "🏖️",
  boating: "⛵",
  budget: "💰",
  camping: "⛺",
  culture: "🎭",
  cycling: "🚲",
  "disability-friendly": "♿",
  diving: "🤿",
  food: "🍽️",
  gambling: "🎰",
  golf: "⛳",
  hiking: "🥾",
  "kid-friendly": "🧸",
  "lgbt-friendly": "🏳️‍🌈",
  museums: "🖼️",
  nature: "🌿",
  nightlife: "🪩",
  overall: "⭐",
  "photographic-hotspots": "📸",
  "public-transit": "🚇",
  romantic: "💕",
  safety: "🛡️",
  scenery: "🌄",
  shopping: "🛍️",
  sightseeing: "🗺️",
  ski: "🎿",
  walkability: "🚶",
  wellness: "🧘",
  wildlife: "🐾",
  "winter-sports": "🏂",
  "women-friendly": "🙋‍♀️",
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

const ScoreBar = ({
  score,
  className,
}: {
  score: DestinationScore;
  className: string;
}) => {
  const tier = getScoreTier(score.score);

  return (
    <div
      role="progressbar"
      aria-label={score.name}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={score.score}
      className={`${className} overflow-hidden rounded-full bg-slate-700`}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${score.score * 10}%`,
          backgroundColor: SCORE_TIERS[tier].color,
        }}
      />
    </div>
  );
};

const ScoreCard = ({
  score,
  compact = false,
}: {
  score: DestinationScore;
  compact?: boolean;
}) => {
  const label = (
    <span className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
      <span aria-hidden="true" className="shrink-0">
        {scoreEmojis[score.slug] ?? "✨"}
      </span>
      <span className="truncate">{score.name}</span>
    </span>
  );

  if (compact) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-2 sm:grid-cols-[minmax(10rem,13rem)_minmax(0,1fr)_3rem]">
        <div className="col-start-1 row-start-1">{label}</div>
        <ScoreBar
          score={score}
          className="col-span-2 col-start-1 row-start-2 h-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
        />
        <span className="col-start-2 row-start-1 text-right text-sm font-medium tabular-nums text-white sm:col-start-3">
          {score.score.toFixed(1)}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        {label}
        <span className="text-lg font-semibold text-white">
          {score.score.toFixed(1)}
        </span>
      </div>
      <ScoreBar score={score} className="h-1.5" />
    </div>
  );
};

export const DestinationScores = ({ scores }: DestinationScoresProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const scoreListId = useId();

  const groups = scoreGroups
    .map((group) => ({
      ...group,
      scores: scores
        .filter((score) => group.slugs.includes(score.slug))
        .toSorted((a, b) => b.score - a.score),
    }))
    .filter((group) => group.scores.length > 0);
  const allScores = groups.flatMap((group) => group.scores);
  const summaryScores = allScores.toSorted(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name),
  );
  const canExpand = allScores.length > SUMMARY_SCORE_COUNT;

  return (
    <section>
      <h2 className="mb-8 text-2xl font-semibold">Destination Scores</h2>
      {allScores.length === 0 ? (
        <p className="text-slate-400">No destination scores available yet</p>
      ) : (
        <div className="rounded-xl border border-white/10 bg-slate-900 p-6">
          <div className="mb-5">
            <h3 className="text-lg font-medium text-slate-200">
              {isExpanded ? "All Scores" : "Summary"}
            </h3>
          </div>

          <div id={scoreListId}>
            {isExpanded ? (
              <div className="space-y-10">
                {groups.map((group) => (
                  <div key={group.title}>
                    <h4 className="mb-4 text-base font-medium text-slate-200">
                      {group.title}
                    </h4>
                    <div className="space-y-1">
                      {group.scores.map((score) => (
                        <ScoreCard key={score.slug} score={score} compact />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {summaryScores.slice(0, SUMMARY_SCORE_COUNT).map((score) => (
                  <ScoreCard key={score.slug} score={score} />
                ))}
              </div>
            )}
          </div>

          {canExpand && (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={scoreListId}
              onClick={() => setIsExpanded((expanded) => !expanded)}
              className="mt-6 w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm font-medium text-sky-300 transition-colors hover:border-sky-400/40 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              {isExpanded ? "Show best scores" : `Show all scores`}
            </button>
          )}
        </div>
      )}
    </section>
  );
};
