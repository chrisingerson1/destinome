import type {
  ClimateClassification,
  CountrySummary,
  DestinationScore,
  GenericType,
  MonthlyWeather,
} from "./index";

export type MapDestination = {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  overallScore: number | null;
  parentDestinationId: number | null;
  country: string;
};

export type MapDestinationScores = {
  id: MapDestination["id"];
  scores: Record<string, number | null>;
};

export type DestinationParent = Pick<MapDestination, "id" | "name" | "slug">;

export type DestinationNeighborhood = Pick<
  MapDestination,
  "id" | "name" | "slug" | "overallScore"
>;

export type DestinationDetail = Pick<MapDestination, "id" | "name" | "slug"> & {
  sourceId: string;

  country: CountrySummary;
  adminArea1: string | null;
  adminArea2: string | null;

  parentDestinationId: number | null;
  parentDestination: DestinationParent | null;
  neighborhoods: DestinationNeighborhood[];

  climate: ClimateClassification | null;
  scores: DestinationScore[];
  monthlyMetrics: MonthlyWeather[];

  destinationTypes: GenericType[];
  knownFor: GenericType[];

  placesToVisit: {
    id: number;
    name: string;
    description: string | null;
  }[];
};
