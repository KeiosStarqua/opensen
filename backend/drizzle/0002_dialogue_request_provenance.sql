ALTER TABLE "dialogues" ADD COLUMN "request_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "dialogues_request_id_uidx" ON "dialogues" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_generations_request_id_step_uidx" ON "ai_generations" USING btree ("request_id","step");
