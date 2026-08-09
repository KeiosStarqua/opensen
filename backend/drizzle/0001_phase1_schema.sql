CREATE TYPE "public"."chunk_status" AS ENUM('new', 'learning', 'review', 'relearning');--> statement-breakpoint
CREATE TYPE "public"."embedding_entity_type" AS ENUM('chunk', 'pattern', 'situation');--> statement-breakpoint
CREATE TYPE "public"."practice_mode" AS ENUM('listen_repeat', 'l1_to_l2', 'cloze', 'slot_swap');--> statement-breakpoint
CREATE TYPE "public"."register" AS ENUM('casual', 'neutral', 'polite', 'formal');--> statement-breakpoint
CREATE TYPE "public"."validation_verdict" AS ENUM('pass', 'fail', 'retried');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'unlisted', 'public');--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"goal" text NOT NULL,
	"daily_minutes" integer NOT NULL,
	"learning_style" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"native_language" text NOT NULL,
	"target_language" text NOT NULL,
	"level" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"type" text NOT NULL,
	"meaning" text NOT NULL,
	"pronunciation" text,
	"pattern_id" uuid,
	"level" text NOT NULL,
	"register" "register" NOT NULL,
	"owner_id" uuid,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"source_template_id" uuid
);
--> statement-breakpoint
CREATE TABLE "intents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pattern_intents" (
	"pattern_id" uuid NOT NULL,
	"intent_id" uuid NOT NULL,
	"situation_id" uuid
);
--> statement-breakpoint
CREATE TABLE "pattern_slots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pattern_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"expected_pos" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentence_patterns" (
	"id" uuid PRIMARY KEY NOT NULL,
	"template" text NOT NULL,
	"meaning" text NOT NULL,
	"difficulty" text NOT NULL,
	"level" text NOT NULL,
	"register" "register" NOT NULL,
	"owner_id" uuid,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"source_template_id" uuid
);
--> statement-breakpoint
CREATE TABLE "situations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"role_self" text NOT NULL,
	"role_other" text NOT NULL,
	"goal" text NOT NULL,
	"tone" text NOT NULL,
	"owner_id" uuid,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"source_template_id" uuid
);
--> statement-breakpoint
CREATE TABLE "slot_variants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slot_id" uuid NOT NULL,
	"text" text NOT NULL,
	"meaning" text NOT NULL,
	"level" text NOT NULL,
	"is_validated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_generations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"step" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"schema_version" text NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"validation_verdict" "validation_verdict" NOT NULL,
	"cost" double precision,
	"latency_ms" integer
);
--> statement-breakpoint
CREATE TABLE "dialogue_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dialogue_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"speaker" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dialogues" (
	"id" uuid PRIMARY KEY NOT NULL,
	"situation_id" uuid NOT NULL,
	"title" text NOT NULL,
	"level" text NOT NULL,
	"created_by" text NOT NULL,
	"owner_id" uuid,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"source_template_id" uuid
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" "embedding_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"vector" vector(1536) NOT NULL,
	"model" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_chunks" (
	"line_id" uuid NOT NULL,
	"chunk_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"practice_item_id" uuid NOT NULL,
	"transcript" text NOT NULL,
	"match_score" double precision NOT NULL,
	"used_hint" boolean DEFAULT false NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chunk_id" uuid NOT NULL,
	"slot_id" uuid,
	"mode" "practice_mode" NOT NULL,
	"prompt" text NOT NULL,
	"expected" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"chunk_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"elapsed_days" double precision NOT NULL,
	"scheduled_days" double precision NOT NULL,
	"state_before" "chunk_status" NOT NULL,
	"practice_attempt_id" uuid,
	"review_time" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_chunks" (
	"user_id" uuid NOT NULL,
	"chunk_id" uuid NOT NULL,
	"status" "chunk_status" DEFAULT 'new' NOT NULL,
	"stability" double precision DEFAULT 0 NOT NULL,
	"difficulty" double precision DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"last_review" timestamp with time zone,
	"next_review" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_pattern_id_sentence_patterns_id_fk" FOREIGN KEY ("pattern_id") REFERENCES "public"."sentence_patterns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_source_template_id_chunks_id_fk" FOREIGN KEY ("source_template_id") REFERENCES "public"."chunks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_intents" ADD CONSTRAINT "pattern_intents_pattern_id_sentence_patterns_id_fk" FOREIGN KEY ("pattern_id") REFERENCES "public"."sentence_patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_intents" ADD CONSTRAINT "pattern_intents_intent_id_intents_id_fk" FOREIGN KEY ("intent_id") REFERENCES "public"."intents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_intents" ADD CONSTRAINT "pattern_intents_situation_id_situations_id_fk" FOREIGN KEY ("situation_id") REFERENCES "public"."situations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pattern_slots" ADD CONSTRAINT "pattern_slots_pattern_id_sentence_patterns_id_fk" FOREIGN KEY ("pattern_id") REFERENCES "public"."sentence_patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentence_patterns" ADD CONSTRAINT "sentence_patterns_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentence_patterns" ADD CONSTRAINT "sentence_patterns_source_template_id_sentence_patterns_id_fk" FOREIGN KEY ("source_template_id") REFERENCES "public"."sentence_patterns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situations" ADD CONSTRAINT "situations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situations" ADD CONSTRAINT "situations_source_template_id_situations_id_fk" FOREIGN KEY ("source_template_id") REFERENCES "public"."situations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_variants" ADD CONSTRAINT "slot_variants_slot_id_pattern_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."pattern_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dialogue_lines" ADD CONSTRAINT "dialogue_lines_dialogue_id_dialogues_id_fk" FOREIGN KEY ("dialogue_id") REFERENCES "public"."dialogues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dialogues" ADD CONSTRAINT "dialogues_situation_id_situations_id_fk" FOREIGN KEY ("situation_id") REFERENCES "public"."situations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dialogues" ADD CONSTRAINT "dialogues_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dialogues" ADD CONSTRAINT "dialogues_source_template_id_dialogues_id_fk" FOREIGN KEY ("source_template_id") REFERENCES "public"."dialogues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_chunks" ADD CONSTRAINT "line_chunks_line_id_dialogue_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."dialogue_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_chunks" ADD CONSTRAINT "line_chunks_chunk_id_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_practice_item_id_practice_items_id_fk" FOREIGN KEY ("practice_item_id") REFERENCES "public"."practice_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_items" ADD CONSTRAINT "practice_items_chunk_id_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_items" ADD CONSTRAINT "practice_items_slot_id_pattern_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."pattern_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_history" ADD CONSTRAINT "review_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_history" ADD CONSTRAINT "review_history_chunk_id_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_history" ADD CONSTRAINT "review_history_practice_attempt_id_practice_attempts_id_fk" FOREIGN KEY ("practice_attempt_id") REFERENCES "public"."practice_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_chunks" ADD CONSTRAINT "user_chunks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_chunks" ADD CONSTRAINT "user_chunks_chunk_id_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."chunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pattern_intents_pattern_intent_situation_uidx" ON "pattern_intents" USING btree ("pattern_id","intent_id","situation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pattern_slots_pattern_position_uidx" ON "pattern_slots" USING btree ("pattern_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "pattern_slots_pattern_name_uidx" ON "pattern_slots" USING btree ("pattern_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "dialogue_lines_dialogue_position_uidx" ON "dialogue_lines" USING btree ("dialogue_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "line_chunks_line_chunk_uidx" ON "line_chunks" USING btree ("line_id","chunk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_chunks_user_chunk_uidx" ON "user_chunks" USING btree ("user_id","chunk_id");