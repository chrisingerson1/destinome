export type ScoreFilter = {
  slug: string;
  min: number;
};

export function parseScoreParams(param: string | undefined): ScoreFilter[] {
  if (!param) {
    return [];
  }

  return param
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const [slug, minValue] = value.split(":");
      const min = Number(minValue);

      if (!slug || !Number.isFinite(min) || min < 0 || min > 10) {
        throw new Error(`Invalid score filter: ${value}`);
      }

      return {
        slug: slug.toLowerCase(),
        min,
      };
    });
}
