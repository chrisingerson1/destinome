ALTER TABLE "destination_monthly_metrics" ALTER COLUMN "clear_skies_chance" SET DATA TYPE numeric(5, 4);--> statement-breakpoint
ALTER TABLE "destinations" ADD COLUMN "source_id" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_source_id_unique" UNIQUE("source_id");