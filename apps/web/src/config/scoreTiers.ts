export const SCORE_TIERS = {
  unrated: {
    label: "Unrated",
    range: "No score",
    minScore: null,
    color: "#526071",
    sizeMultiplier: 1,
  },
  limited: {
    label: "Lower Appeal",
    range: "Below 6.0",
    minScore: 0,
    color: "#DD6470",
    sizeMultiplier: 1.1,
  },
  worthwhile: {
    label: "Worthwhile",
    range: "6.0-6.99",
    minScore: 6,
    color: "#F2A34A",
    sizeMultiplier: 1.2,
  },
  strong: {
    label: "Strong",
    range: "7.0-7.99",
    minScore: 7,
    color: "#B6D957",
    sizeMultiplier: 1.5,
  },
  outstanding: {
    label: "Outstanding",
    range: "8.0-8.99",
    minScore: 8,
    color: "#25C6A6",
    sizeMultiplier: 2,
  },
  exceptional: {
    label: "Exceptional",
    range: "9.0-9.49",
    minScore: 9,
    color: "#579BFF",
    sizeMultiplier: 2.6,
  },
  elite: {
    label: "Elite",
    range: "9.5+",
    minScore: 9.5,
    color: "#BD78F4",
    sizeMultiplier: 3.2,
  },
} as const;

export type ScoreTier = keyof typeof SCORE_TIERS;

// Lowest to highest priority, used for rendering.
export const SCORE_TIER_ORDER: ScoreTier[] = [
  "unrated",
  "limited",
  "worthwhile",
  "strong",
  "outstanding",
  "exceptional",
  "elite",
];

// Highest to lowest, used for the legend.
export const SCORE_LEGEND_ORDER = [...SCORE_TIER_ORDER].reverse();

export const getScoreTier = (score: number | null | undefined): ScoreTier => {
  if (score == null || !Number.isFinite(score)) {
    return "unrated";
  }

  for (const tier of SCORE_LEGEND_ORDER) {
    const { minScore } = SCORE_TIERS[tier];

    if (minScore !== null && score >= minScore) {
      return tier;
    }
  }

  return "limited";
};
