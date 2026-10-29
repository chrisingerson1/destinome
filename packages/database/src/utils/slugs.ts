import slugify from "slugify";

export function toSlug(value: string): string {
  return slugify(value, { lower: true, strict: true, trim: true });
}

export function destinationBaseSlug(name: string, parentName: string | null): string {
  return toSlug(parentName === null ? name : `${name}-${parentName}`);
}
