ALTER TABLE "destination_monthly_metrics" DROP CONSTRAINT "clear_skies_chance_range";--> statement-breakpoint
ALTER TABLE "destinations" ADD COLUMN "parent_destination_id" integer;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "admin_level_1_label" varchar(150);--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "admin_level_2_label" varchar(150);--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_parent_destination_id_destinations_id_fk" FOREIGN KEY ("parent_destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "destinations_parent_destination_id_idx" ON "destinations" USING btree ("parent_destination_id");--> statement-breakpoint
ALTER TABLE "destination_monthly_metrics" ADD CONSTRAINT "clear_skies_chance_range" CHECK ("destination_monthly_metrics"."clear_skies_chance" IS NULL OR ("destination_monthly_metrics"."clear_skies_chance" >= 0 AND "destination_monthly_metrics"."clear_skies_chance" <= 1));