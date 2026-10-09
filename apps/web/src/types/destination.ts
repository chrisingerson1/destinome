import type {
  ClimateClassification,
  CountrySummary,
  DestinationScore,
  GenericType,
  MonthlyWeather,
} from "./index";

export type DestinationDetail = {
  id: number;
  sourceId: string;
  name: string;
  slug: string;
  country: CountrySummary;
  adminArea1: string | null;
  adminArea2: string | null;
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
