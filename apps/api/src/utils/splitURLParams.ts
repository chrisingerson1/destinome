// Split URL params such as "continents=europe,asia" to an array of lowercase strings without duplicates
export function splitURLParams(
  param: string | undefined,
  lowercase = true,
): string[] {
  return [
    ...new Set(
      param
        ?.split(",")
        .map((p) => {
          const trimmed = p.trim();
          return lowercase ? trimmed.toLowerCase() : trimmed;
        })
        .filter(Boolean) ?? [],
    ),
  ];
}
