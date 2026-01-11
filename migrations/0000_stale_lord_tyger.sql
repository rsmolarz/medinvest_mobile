CREATE TYPE "public"."article_category" AS ENUM('AI & Healthcare', 'Biotech', 'Medical Devices', 'Digital Health', 'Market Trends', 'Regulations', 'Research');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('apple', 'google', 'email');--> statement-breakpoint
CREATE TYPE "public"."investment_category" AS ENUM('Biotech', 'Medical Devices', 'Digital Health', 'Pharmaceuticals', 'Research', 'Healthcare Services');--> statement-breakpoint
CREATE TYPE "public"."investment_status" AS ENUM('active', 'funded', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('investment_update', 'portfolio_milestone', 'new_opportunity', 'article', 'system');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('bank', 'card');--> statement-breakpoint
CREATE TYPE "public"."portfolio_status" AS ENUM('active', 'completed', 'pending', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('Low', 'Medium', 'High');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('investment', 'dividend', 'withdrawal', 'refund');--> statement-breakpoint
CREATE TABLE "article_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"summary" text NOT NULL,
	"content" text,
	"source" varchar(255) NOT NULL,
	"source_url" text,
	"author" varchar(255),
	"image_url" text,
	"category" "article_category" NOT NULL,
	"tags" text,
	"read_time" integer DEFAULT 5 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investment_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investment_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"target_date" timestamp,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investment_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"avatar_url" text,
	"linkedin_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"category" "investment_category" NOT NULL,
	"funding_goal" numeric(15, 2) NOT NULL,
	"funding_current" numeric(15, 2) DEFAULT '0' NOT NULL,
	"minimum_investment" numeric(15, 2) DEFAULT '1000' NOT NULL,
	"expected_roi_min" numeric(5, 2),
	"expected_roi_max" numeric(5, 2),
	"risk_level" "risk_level" DEFAULT 'Medium' NOT NULL,
	"status" "investment_status" DEFAULT 'active' NOT NULL,
	"image_url" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"investor_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"investment_updates" boolean DEFAULT true NOT NULL,
	"new_opportunities" boolean DEFAULT true NOT NULL,
	"portfolio_milestones" boolean DEFAULT true NOT NULL,
	"articles" boolean DEFAULT false NOT NULL,
	"marketing" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"data" text,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"last4" varchar(4) NOT NULL,
	"expiry_month" integer,
	"expiry_year" integer,
	"bank_name" varchar(255),
	"is_default" boolean DEFAULT false NOT NULL,
	"stripe_payment_method_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"investment_id" uuid NOT NULL,
	"amount_invested" numeric(15, 2) NOT NULL,
	"current_value" numeric(15, 2) NOT NULL,
	"shares" numeric(15, 6),
	"status" "portfolio_status" DEFAULT 'pending' NOT NULL,
	"invested_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"portfolio_investment_id" uuid,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"payment_method_id" uuid,
	"reference" varchar(255),
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(20),
	"avatar_url" text,
	"provider" "auth_provider" DEFAULT 'email' NOT NULL,
	"provider_user_id" varchar(255),
	"password_hash" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_accredited" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "article_bookmarks" ADD CONSTRAINT "article_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_bookmarks" ADD CONSTRAINT "article_bookmarks_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_documents" ADD CONSTRAINT "investment_documents_investment_id_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_milestones" ADD CONSTRAINT "investment_milestones_investment_id_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_team_members" ADD CONSTRAINT "investment_team_members_investment_id_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_investments" ADD CONSTRAINT "portfolio_investments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_investments" ADD CONSTRAINT "portfolio_investments_investment_id_investments_id_fk" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_portfolio_investment_id_portfolio_investments_id_fk" FOREIGN KEY ("portfolio_investment_id") REFERENCES "public"."portfolio_investments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookmarks_user_id_idx" ON "article_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_user_article_idx" ON "article_bookmarks" USING btree ("user_id","article_id");--> statement-breakpoint
CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "articles_featured_idx" ON "articles" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "inv_docs_investment_id_idx" ON "investment_documents" USING btree ("investment_id");--> statement-breakpoint
CREATE INDEX "inv_milestones_investment_id_idx" ON "investment_milestones" USING btree ("investment_id");--> statement-breakpoint
CREATE INDEX "inv_team_investment_id_idx" ON "investment_team_members" USING btree ("investment_id");--> statement-breakpoint
CREATE INDEX "investments_status_idx" ON "investments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "investments_category_idx" ON "investments" USING btree ("category");--> statement-breakpoint
CREATE INDEX "investments_end_date_idx" ON "investments" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "portfolio_user_id_idx" ON "portfolio_investments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "portfolio_investment_id_idx" ON "portfolio_investments" USING btree ("investment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_user_investment_idx" ON "portfolio_investments" USING btree ("user_id","investment_id");--> statement-breakpoint
CREATE INDEX "push_tokens_user_id_idx" ON "push_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_tokens_token_idx" ON "push_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "user_sessions" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_provider_idx" ON "users" USING btree ("provider","provider_user_id");