import type { FastifyInstance } from "fastify";

import { asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { StatusCodes } from "http-status-codes";

import {
  administrativeAreas,
  climateClassifications,
  continents,
  countries,
  db,
  destinations,
  destinationMonthlyMetrics,
  destinationTagScores,
  destinationsDestinationTypes,
  destinationsGeoSubregions,
  destinationsKnownFor,
  destinationsContinents,
  destinationTypes,
  geoSubregions,
  knownFor,
  placesToVisit,
  tags,
} from "@destinome/database";

type DestinationParams = {
  slug: string;
};

const adminArea = alias(administrativeAreas, "detail_admin_area");
const parentAdminArea = alias(administrativeAreas, "detail_parent_admin_area");

export async function destinationDetailsRoutes(app: FastifyInstance) {
  app.get<{ Params: DestinationParams }>(
    "/destination/:slug",
    async (request, reply) => {
      const slug = request.params.slug.trim().toLowerCase();

      const [destination] = await db
        .select({
          id: destinations.id,
          sourceId: destinations.sourceId,
          name: destinations.name,
          slug: destinations.slug,

          latitude: destinations.latitude,
          longitude: destinations.longitude,
          timezone: destinations.timezone,
          elevation: destinations.elevation,

          population: destinations.population,
          populationYear: destinations.populationYear,

          area: destinations.area,

          annualTourists: destinations.annualTourists,
          annualTouristsYear: destinations.annualTouristsYear,

          isAirlineHub: destinations.isAirlineHub,

          idealDaysMin: destinations.idealDaysMin,
          idealDaysMax: destinations.idealDaysMax,

          country: {
            name: countries.name,
            iso2: countries.iso2,
            iso3: countries.iso3,
          },

          currentAdminName: adminArea.name,
          currentAdminLevel: adminArea.level,
          parentAdminName: parentAdminArea.name,

          climate: {
            code: climateClassifications.code,
            name: climateClassifications.name,
            description: climateClassifications.description,
          },
        })
        .from(destinations)
        .innerJoin(countries, eq(destinations.countryId, countries.id))
        .leftJoin(
          adminArea,
          eq(destinations.administrativeAreaId, adminArea.id),
        )
        .leftJoin(parentAdminArea, eq(adminArea.parentId, parentAdminArea.id))
        .leftJoin(
          climateClassifications,
          eq(destinations.climateClassificationId, climateClassifications.id),
        )
        .where(eq(destinations.slug, slug))
        .limit(1);

      if (!destination) {
        return reply.code(StatusCodes.NOT_FOUND).send({
          error: "Destination not found",
        });
      }

      const [
        continentRows,
        subregionRows,
        typeRows,
        scoreRows,
        monthlyRows,
        knownForRows,
        placeRows,
      ] = await Promise.all([
        db
          .select({
            name: continents.name,
            slug: continents.slug,
            isPrimary: destinationsContinents.isPrimary,
          })
          .from(destinationsContinents)
          .innerJoin(
            continents,
            eq(destinationsContinents.continentId, continents.id),
          )
          .where(eq(destinationsContinents.destinationId, destination.id))
          .orderBy(
            desc(destinationsContinents.isPrimary),
            asc(continents.name),
          ),

        db
          .select({
            name: geoSubregions.name,
            slug: geoSubregions.slug,
          })
          .from(destinationsGeoSubregions)
          .innerJoin(
            geoSubregions,
            eq(destinationsGeoSubregions.geoSubregionId, geoSubregions.id),
          )
          .where(eq(destinationsGeoSubregions.destinationId, destination.id)),

        db
          .select({
            name: destinationTypes.name,
            slug: destinationTypes.slug,
          })
          .from(destinationsDestinationTypes)
          .innerJoin(
            destinationTypes,
            eq(
              destinationsDestinationTypes.destinationTypeId,
              destinationTypes.id,
            ),
          )
          .where(eq(destinationsDestinationTypes.destinationId, destination.id))
          .orderBy(asc(destinationTypes.name)),

        db
          .select({
            name: tags.name,
            slug: tags.slug,
            score: destinationTagScores.score,
            notes: destinationTagScores.notes,
            methodologyVersion: destinationTagScores.methodologyVersion,
          })
          .from(destinationTagScores)
          .innerJoin(tags, eq(destinationTagScores.tagId, tags.id))
          .where(eq(destinationTagScores.destinationId, destination.id))
          .orderBy(asc(tags.name)),

        db
          .select()
          .from(destinationMonthlyMetrics)
          .where(eq(destinationMonthlyMetrics.destinationId, destination.id))
          .orderBy(asc(destinationMonthlyMetrics.month)),

        db
          .select({
            name: knownFor.name,
            slug: knownFor.slug,
            displayOrder: destinationsKnownFor.displayOrder,
          })
          .from(destinationsKnownFor)
          .innerJoin(knownFor, eq(destinationsKnownFor.knownForId, knownFor.id))
          .where(eq(destinationsKnownFor.destinationId, destination.id))
          .orderBy(asc(destinationsKnownFor.displayOrder)),

        db
          .select({
            id: placesToVisit.id,
            name: placesToVisit.name,
            description: placesToVisit.description,
            displayOrder: placesToVisit.displayOrder,
          })
          .from(placesToVisit)
          .where(eq(placesToVisit.destinationId, destination.id))
          .orderBy(asc(placesToVisit.displayOrder)),
      ]);

      const adminArea1 =
        destination.currentAdminLevel === 1
          ? destination.currentAdminName
          : destination.parentAdminName;

      const adminArea2 =
        destination.currentAdminLevel === 2
          ? destination.currentAdminName
          : null;

      return {
        data: {
          id: destination.id,
          sourceId: destination.sourceId,
          name: destination.name,
          slug: destination.slug,

          country: destination.country,

          adminArea1,
          adminArea2,

          coordinates: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },

          timezone: destination.timezone,
          elevation: destination.elevation,

          population: destination.population,
          populationYear: destination.populationYear,

          area: destination.area,

          annualTourists: destination.annualTourists,
          annualTouristsYear: destination.annualTouristsYear,

          isAirlineHub: destination.isAirlineHub,

          idealDays: {
            min: destination.idealDaysMin,
            max: destination.idealDaysMax,
          },

          climate:
            destination.climate?.code === null ? null : destination.climate,

          continents: continentRows,
          geoSubregions: subregionRows,
          types: typeRows,
          scores: scoreRows,
          monthlyMetrics: monthlyRows,
          knownFor: knownForRows,
          placesToVisit: placeRows,
        },
      };
    },
  );
}
