export type ScoreFilter = {
  slug: string;
  min: number;
};

export class InvalidScoreFilterError extends Error {}

export function parseScoreParams(param: string | undefined): ScoreFilter[] {
  if (param === undefined || param === "") {
    return [];
  }

  if (typeof param !== "string") {
    throw new InvalidScoreFilterError("Scores must be a comma-separated string");
  }

  return param
    .split(",")
    .map((value) => value.trim())
    .map((value) => {
      const parts = value.split(":");
      const slug = parts[0]?.trim().toLowerCase();
      const minValue = parts[1]?.trim();
      const min = Number(minValue);

      if (
        parts.length !== 2 ||
        !slug ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
        !minValue ||
        !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(minValue) ||
        !Number.isFinite(min) ||
        min < 0 ||
        min > 10
      ) {
        throw new InvalidScoreFilterError(`Invalid score filter: ${value}`);
      }

      return {
        slug,
        min,
      };
    });
}
