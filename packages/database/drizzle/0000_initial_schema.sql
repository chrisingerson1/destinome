CREATE TABLE "destination_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "destination_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	CONSTRAINT "destination_types_name_unique" UNIQUE("name"),
	CONSTRAINT "destination_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "destinations_destination_types" (
	"destination_id" integer NOT NULL,
	"destination_type_id" integer NOT NULL,
	CONSTRAINT "destinations_destination_types_destination_id_destination_type_id_pk" PRIMARY KEY("destination_id","destination_type_id")
);
--> statement-breakpoint
CREATE TABLE "destinations_geo_subregions" (
	"destination_id" integer NOT NULL,
	"geo_subregion_id" integer NOT NULL,
	CONSTRAINT "destinations_geo_subregions_destination_id_geo_subregion_id_pk" PRIMARY KEY("destination_id","geo_subregion_id")
);
--> statement-breakpoint
CREATE TABLE "destinations_known_for" (
	"destination_id" integer NOT NULL,
	"known_for_id" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "destinations_known_for_destination_id_known_for_id_pk" PRIMARY KEY("destination_id","known_for_id")
);
--> statement-breakpoint
CREATE TABLE "known_for" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "known_for_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	CONSTRAINT "known_for_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "places_to_visit" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "places_to_visit_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"destination_id" integer NOT NULL,
	"name" varchar(250) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "destinations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"country_id" integer NOT NULL,
	"administrative_area_id" integer,
	"timezone" varchar(100),
	"climate_classification_id" integer,
	"latitude" double precision,
	"longitude" double precision,
	"elevation" integer,
	"population" bigint,
	"population_year" smallint,
	"area" numeric(12, 2),
	"annual_tourists" bigint,
	"annual_tourists_year" smallint,
	"is_airline_hub" boolean DEFAULT false NOT NULL,
	"ideal_days_min" smallint,
	"ideal_days_max" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destinations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "administrative_areas" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "administrative_areas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"country_id" integer NOT NULL,
	"parent_id" integer,
	"name" varchar(200) NOT NULL,
	"level" smallint NOT NULL,
	CONSTRAINT "administrative_area_unique_idx" UNIQUE("country_id","parent_id","level","name")
);
--> statement-breakpoint
CREATE TABLE "climate_classifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "climate_classifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(4) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" varchar(500) NOT NULL,
	CONSTRAINT "climate_classifications_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "continents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "continents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	CONSTRAINT "continents_name_unique" UNIQUE("name"),
	CONSTRAINT "continents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "countries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"continent_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"iso2" varchar(2) NOT NULL,
	"iso3" varchar(3) NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name"),
	CONSTRAINT "countries_iso2_unique" UNIQUE("iso2"),
	CONSTRAINT "countries_iso3_unique" UNIQUE("iso3")
);
--> statement-breakpoint
CREATE TABLE "geo_subregions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "geo_subregions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	CONSTRAINT "geo_subregions_name_unique" UNIQUE("name"),
	CONSTRAINT "geo_subregions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "destination_monthly_metrics" (
	"destination_id" integer NOT NULL,
	"month" smallint NOT NULL,
	"tourism_index" numeric(3, 1),
	"average_high" numeric(4, 1),
	"average_low" numeric(4, 1),
	"clear_skies_chance" numeric(5, 2),
	"precipitation_days" numeric(4, 1),
	"rainfall" numeric(6, 2),
	"snowfall" numeric(6, 2),
	"daylight_hours" numeric(4, 2),
	"muggy_days" numeric(4, 1),
	"average_wind_speed" numeric(4, 1),
	"average_water_temperature" numeric(4, 1),
	"solar_energy" numeric(6, 2),
	"tourism_score" numeric(3, 1),
	"beach_pool_score" numeric(3, 1),
	CONSTRAINT "destination_monthly_metrics_destination_id_month_pk" PRIMARY KEY("destination_id","month"),
	CONSTRAINT "monthly_metric_month_range" CHECK ("destination_monthly_metrics"."month" >= 1 AND "destination_monthly_metrics"."month" <= 12),
	CONSTRAINT "tourism_index_range" CHECK ("destination_monthly_metrics"."tourism_index" IS NULL OR ("destination_monthly_metrics"."tourism_index" >= 0 AND "destination_monthly_metrics"."tourism_index" <= 10)),
	CONSTRAINT "clear_skies_chance_range" CHECK ("destination_monthly_metrics"."clear_skies_chance" IS NULL OR ("destination_monthly_metrics"."clear_skies_chance" >= 0 AND "destination_monthly_metrics"."clear_skies_chance" <= 100)),
	CONSTRAINT "precipitation_days_range" CHECK ("destination_monthly_metrics"."precipitation_days" IS NULL OR ("destination_monthly_metrics"."precipitation_days" >= 0 AND "destination_monthly_metrics"."precipitation_days" <= 31)),
	CONSTRAINT "daylight_hours_range" CHECK ("destination_monthly_metrics"."daylight_hours" IS NULL OR ("destination_monthly_metrics"."daylight_hours" >= 0 AND "destination_monthly_metrics"."daylight_hours" <= 24)),
	CONSTRAINT "muggy_days_range" CHECK ("destination_monthly_metrics"."muggy_days" IS NULL OR ("destination_monthly_metrics"."muggy_days" >= 0 AND "destination_monthly_metrics"."muggy_days" <= 31)),
	CONSTRAINT "tourism_score_range" CHECK ("destination_monthly_metrics"."tourism_score" IS NULL OR ("destination_monthly_metrics"."tourism_score" >= 0 AND "destination_monthly_metrics"."tourism_score" <= 10)),
	CONSTRAINT "beach_pool_score_range" CHECK ("destination_monthly_metrics"."beach_pool_score" IS NULL OR ("destination_monthly_metrics"."beach_pool_score" >= 0 AND "destination_monthly_metrics"."beach_pool_score" <= 10))
);
--> statement-breakpoint
CREATE TABLE "destination_tag_scores" (
	"destination_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"score" numeric(3, 1) NOT NULL,
	"notes" text,
	"methodology_version" varchar(50),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destination_tag_scores_destination_id_tag_id_pk" PRIMARY KEY("destination_id","tag_id"),
	CONSTRAINT "destination_tag_score_range" CHECK ("destination_tag_scores"."score" >= 0 AND "destination_tag_scores"."score" <= 10)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "destination_sources" (
	"destination_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	"notes" text,
	CONSTRAINT "destination_sources_destination_id_source_id_pk" PRIMARY KEY("destination_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(250) NOT NULL,
	"url" text,
	CONSTRAINT "sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "destinations_destination_types" ADD CONSTRAINT "destinations_destination_types_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations_destination_types" ADD CONSTRAINT "destinations_destination_types_destination_type_id_destination_types_id_fk" FOREIGN KEY ("destination_type_id") REFERENCES "public"."destination_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations_geo_subregions" ADD CONSTRAINT "destinations_geo_subregions_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations_geo_subregions" ADD CONSTRAINT "destinations_geo_subregions_geo_subregion_id_geo_subregions_id_fk" FOREIGN KEY ("geo_subregion_id") REFERENCES "public"."geo_subregions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations_known_for" ADD CONSTRAINT "destinations_known_for_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations_known_for" ADD CONSTRAINT "destinations_known_for_known_for_id_known_for_id_fk" FOREIGN KEY ("known_for_id") REFERENCES "public"."known_for"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places_to_visit" ADD CONSTRAINT "places_to_visit_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_administrative_area_id_administrative_areas_id_fk" FOREIGN KEY ("administrative_area_id") REFERENCES "public"."administrative_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_climate_classification_id_climate_classifications_id_fk" FOREIGN KEY ("climate_classification_id") REFERENCES "public"."climate_classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "administrative_areas" ADD CONSTRAINT "administrative_areas_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "administrative_areas" ADD CONSTRAINT "administrative_areas_parent_id_administrative_areas_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."administrative_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_continent_id_continents_id_fk" FOREIGN KEY ("continent_id") REFERENCES "public"."continents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_monthly_metrics" ADD CONSTRAINT "destination_monthly_metrics_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_tag_scores" ADD CONSTRAINT "destination_tag_scores_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_tag_scores" ADD CONSTRAINT "destination_tag_scores_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_sources" ADD CONSTRAINT "destination_sources_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_sources" ADD CONSTRAINT "destination_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;