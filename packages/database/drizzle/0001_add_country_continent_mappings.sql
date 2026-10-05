CREATE TABLE "destinations_continents" (
	"destination_id" integer NOT NULL,
	"continent_id" integer NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	CONSTRAINT "destinations_continents_destination_id_continent_id_pk" PRIMARY KEY("destination_id","continent_id")
);
--> statement-breakpoint
CREATE TABLE "countries_continents" (
	"country_id" integer NOT NULL,
	"continent_id" integer NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	CONSTRAINT "countries_continents_country_id_continent_id_pk" PRIMARY KEY("country_id","continent_id")
);
--> statement-breakpoint
ALTER TABLE "administrative_areas" DROP CONSTRAINT "administrative_area_unique_idx";--> statement-breakpoint
ALTER TABLE "countries" DROP CONSTRAINT "countries_continent_id_continents_id_fk";
--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "is_sovereign" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "sovereign_country_id" integer;--> statement-breakpoint
ALTER TABLE "destinations_continents" ADD CONSTRAINT "destinations_continents_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations_continents" ADD CONSTRAINT "destinations_continents_continent_id_continents_id_fk" FOREIGN KEY ("continent_id") REFERENCES "public"."continents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "countries_continents" ADD CONSTRAINT "countries_continents_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "countries_continents" ADD CONSTRAINT "countries_continents_continent_id_continents_id_fk" FOREIGN KEY ("continent_id") REFERENCES "public"."continents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_sovereign_country_id_countries_id_fk" FOREIGN KEY ("sovereign_country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "countries" DROP COLUMN "continent_id";--> statement-breakpoint
ALTER TABLE "administrative_areas" ADD CONSTRAINT "administrative_area_unique_idx" UNIQUE NULLS NOT DISTINCT("country_id","parent_id","level","name");