import { db } from "../db.js";
import { climateClassifications } from "../schema/geography.js";

const climateClassificationData = [
  {
    code: "Af",
    name: "Tropical rainforest",
    description:
      "Hot and humid year-round with significant rainfall in every month.",
  },
  {
    code: "Am",
    name: "Tropical monsoon",
    description:
      "Hot year-round with a pronounced monsoon season and a short drier period.",
  },
  {
    code: "Aw",
    name: "Tropical savanna, dry winter",
    description:
      "Hot year-round with a distinct dry winter and wetter summer season.",
  },
  {
    code: "As",
    name: "Tropical savanna, dry summer",
    description: "Hot year-round with a distinct dry summer season.",
  },

  {
    code: "BWh",
    name: "Hot desert",
    description:
      "Very dry climate with hot annual temperatures and minimal precipitation.",
  },
  {
    code: "BWk",
    name: "Cold desert",
    description:
      "Very dry climate with cooler annual temperatures and large seasonal variation.",
  },
  {
    code: "BSh",
    name: "Hot semi-arid",
    description:
      "Dry, warm climate receiving more precipitation than a desert but less than humid regions.",
  },
  {
    code: "BSk",
    name: "Cold semi-arid",
    description:
      "Dry climate with cooler annual temperatures and limited precipitation.",
  },

  {
    code: "Csa",
    name: "Hot-summer Mediterranean",
    description: "Hot, dry summers with mild, wetter winters.",
  },
  {
    code: "Csb",
    name: "Warm-summer Mediterranean",
    description: "Warm, dry summers with mild, wetter winters.",
  },
  {
    code: "Csc",
    name: "Cold-summer Mediterranean",
    description: "Cool, dry summers with mild to cold, wetter winters.",
  },
  {
    code: "Cwa",
    name: "Humid subtropical, dry winter",
    description:
      "Hot summers, mild winters, and a pronounced dry winter season.",
  },
  {
    code: "Cwb",
    name: "Subtropical highland, dry winter",
    description:
      "Mild summers, cool dry winters, and wetter summers, often at higher elevations.",
  },
  {
    code: "Cwc",
    name: "Cold subtropical highland, dry winter",
    description:
      "Cool summers and cold, dry winters, typically at high elevations.",
  },
  {
    code: "Cfa",
    name: "Humid subtropical",
    description:
      "Hot, humid summers, mild winters, and precipitation throughout the year.",
  },
  {
    code: "Cfb",
    name: "Oceanic",
    description:
      "Mild summers, cool winters, and relatively even precipitation year-round.",
  },
  {
    code: "Cfc",
    name: "Subpolar oceanic",
    description:
      "Short, cool summers, mild-to-cold winters, and precipitation throughout the year.",
  },

  {
    code: "Dsa",
    name: "Hot-summer continental, dry summer",
    description: "Hot, dry summers and cold, wetter winters.",
  },
  {
    code: "Dsb",
    name: "Warm-summer continental, dry summer",
    description: "Warm, dry summers with cold winters.",
  },
  {
    code: "Dsc",
    name: "Subarctic, dry summer",
    description: "Short, cool, dry summers and long, cold winters.",
  },
  {
    code: "Dsd",
    name: "Extremely cold subarctic, dry summer",
    description: "Short, cool, dry summers and extremely cold winters.",
  },
  {
    code: "Dwa",
    name: "Hot-summer continental, dry winter",
    description: "Hot, humid summers and cold, very dry winters.",
  },
  {
    code: "Dwb",
    name: "Warm-summer continental, dry winter",
    description: "Warm summers with cold, dry winters.",
  },
  {
    code: "Dwc",
    name: "Subarctic, dry winter",
    description: "Short, cool summers and long, very cold, dry winters.",
  },
  {
    code: "Dwd",
    name: "Extremely cold subarctic, dry winter",
    description: "Short summers and extremely cold, dry winters.",
  },
  {
    code: "Dfa",
    name: "Hot-summer humid continental",
    description:
      "Hot summers, cold winters, and precipitation throughout the year.",
  },
  {
    code: "Dfb",
    name: "Warm-summer humid continental",
    description: "Warm summers, cold winters, and year-round precipitation.",
  },
  {
    code: "Dfc",
    name: "Subarctic",
    description:
      "Short, cool summers and long, cold winters with year-round precipitation.",
  },
  {
    code: "Dfd",
    name: "Extremely cold subarctic",
    description:
      "Short summers and extremely cold winters with precipitation throughout the year.",
  },

  {
    code: "ET",
    name: "Tundra",
    description:
      "Very cold climate where the warmest month remains cool and trees cannot grow.",
  },
  {
    code: "EF",
    name: "Ice cap",
    description:
      "Extremely cold year-round, with temperatures remaining below freezing even in summer.",
  },
];

export async function seedClimateClassifications() {
  await db
    .insert(climateClassifications)
    .values(climateClassificationData)
    .onConflictDoNothing();

  console.log(
    `Seeded ${climateClassificationData.length} climate classifications.`,
  );
}
