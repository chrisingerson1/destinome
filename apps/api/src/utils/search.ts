const tokenAliases: Record<string, string[]> = {
  saint: ["saint", "st"],
  st: ["st", "saint"],

  mount: ["mount", "mt"],
  mt: ["mt", "mount"],

  fort: ["fort", "ft"],
  ft: ["ft", "fort"],
};

export function getSearchPatterns(input: string) {
  const terms = input
    .trim()
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  if (terms.length === 0) {
    return [];
  }

  let combinations: string[][] = [[]];

  for (const term of terms) {
    const variants = tokenAliases[term] ?? [term];

    combinations = combinations.flatMap((combo) =>
      variants.map((variant) => [...combo, variant]),
    );
  }

  return combinations.map((combo) => `${combo.join("%")}%`);
}
