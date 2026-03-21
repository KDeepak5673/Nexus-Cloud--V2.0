-- Billing system migration

CREATE TYPE "MetricType" AS ENUM ('BUILD_MINUTES', 'EGRESS_MB');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE', 'FAILED');
CREATE TYPE "PaymentEventStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');
CREATE TYPE "BillingAccountUserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "QuotaEnforcementType" AS ENUM ('SOFT', 'HARD');

CREATE TABLE "billing_accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "default_payment_method_id" TEXT,
    "budget_soft_limit_usd" DECIMAL(12,2),
    "budget_hard_limit_usd" DECIMAL(12,2),
    "grace_until" TIMESTAMP(3),
    "is_dunning_active" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billing_account_members" (
    "id" TEXT NOT NULL,
    "billing_account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "BillingAccountUserRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "billing_account_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usage_events_raw" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "source_service" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "project_id" TEXT,
    "metric_type" "MetricType" NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "trace_id" TEXT,
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_events_raw_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usage_aggregates_hourly" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "project_id" TEXT,
    "metric_type" "MetricType" NOT NULL,
    "bucket_start" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit_cost_usd" DECIMAL(12,6) NOT NULL,
    "cost_usd" DECIMAL(12,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usage_aggregates_hourly_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usage_aggregates_daily" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "project_id" TEXT,
    "metric_type" "MetricType" NOT NULL,
    "bucket_date" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit_cost_usd" DECIMAL(12,6) NOT NULL,
    "cost_usd" DECIMAL(12,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usage_aggregates_daily_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usage_aggregates_monthly" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "project_id" TEXT,
    "metric_type" "MetricType" NOT NULL,
    "month_start" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit_cost_usd" DECIMAL(12,6) NOT NULL,
    "cost_usd" DECIMAL(12,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usage_aggregates_monthly_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "metric_type" "MetricType" NOT NULL,
    "unit_price_usd" DECIMAL(12,6) NOT NULL,
    "included_units" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "active_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active_to" TIMESTAMP(3),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quota_policies" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "metric_type" "MetricType" NOT NULL,
    "monthly_included" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "soft_limit_percent" INTEGER NOT NULL DEFAULT 80,
    "hard_limit_percent" INTEGER NOT NULL DEFAULT 100,
    "enforcement" "QuotaEnforcementType" NOT NULL DEFAULT 'SOFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quota_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal_usd" DECIMAL(12,2) NOT NULL,
    "tax_usd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_usd" DECIMAL(12,2) NOT NULL,
    "stripe_invoice_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_hosted_invoice_url" TEXT,
    "external_pdf_url" TEXT,
    "snapshot_json" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "metric_type" "MetricType" NOT NULL,
    "project_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit_price_usd" DECIMAL(12,6) NOT NULL,
    "amount_usd" DECIMAL(12,2) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "stripe_event_id" TEXT,
    "stripe_object_id" TEXT,
    "status" "PaymentEventStatus" NOT NULL DEFAULT 'PENDING',
    "amount_usd" DECIMAL(12,2),
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "billing_adjustments" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "metric_type" "MetricType",
    "project_id" TEXT,
    "amount_usd" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "created_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "billing_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project" ADD COLUMN "billing_account_id" TEXT;

CREATE UNIQUE INDEX "billing_accounts_stripe_customer_id_key" ON "billing_accounts"("stripe_customer_id");
CREATE UNIQUE INDEX "billing_account_members_billing_account_id_user_id_key" ON "billing_account_members"("billing_account_id", "user_id");
CREATE INDEX "billing_account_members_user_id_idx" ON "billing_account_members"("user_id");
CREATE UNIQUE INDEX "usage_events_raw_event_id_key" ON "usage_events_raw"("event_id");
CREATE INDEX "usage_events_raw_account_id_occurred_at_idx" ON "usage_events_raw"("account_id", "occurred_at");
CREATE INDEX "usage_events_raw_project_id_occurred_at_idx" ON "usage_events_raw"("project_id", "occurred_at");
CREATE INDEX "usage_events_raw_metric_type_occurred_at_idx" ON "usage_events_raw"("metric_type", "occurred_at");
CREATE UNIQUE INDEX "usage_aggregates_hourly_unique" ON "usage_aggregates_hourly"("account_id", "project_id", "metric_type", "bucket_start");
CREATE UNIQUE INDEX "usage_aggregates_daily_unique" ON "usage_aggregates_daily"("account_id", "project_id", "metric_type", "bucket_date");
CREATE UNIQUE INDEX "usage_aggregates_monthly_unique" ON "usage_aggregates_monthly"("account_id", "project_id", "metric_type", "month_start");
CREATE UNIQUE INDEX "quota_policies_account_id_metric_type_key" ON "quota_policies"("account_id", "metric_type");
CREATE UNIQUE INDEX "invoices_stripe_invoice_id_key" ON "invoices"("stripe_invoice_id");
CREATE INDEX "invoices_account_id_period_start_idx" ON "invoices"("account_id", "period_start");
CREATE UNIQUE INDEX "payment_events_stripe_event_id_key" ON "payment_events"("stripe_event_id");
CREATE UNIQUE INDEX "webhook_events_event_id_key" ON "webhook_events"("event_id");
CREATE INDEX "Project_billing_account_id_idx" ON "Project"("billing_account_id");

ALTER TABLE "Project" ADD CONSTRAINT "Project_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_account_members" ADD CONSTRAINT "billing_account_members_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "billing_account_members" ADD CONSTRAINT "billing_account_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usage_events_raw" ADD CONSTRAINT "usage_events_raw_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usage_events_raw" ADD CONSTRAINT "usage_events_raw_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "usage_aggregates_hourly" ADD CONSTRAINT "usage_aggregates_hourly_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usage_aggregates_hourly" ADD CONSTRAINT "usage_aggregates_hourly_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "usage_aggregates_daily" ADD CONSTRAINT "usage_aggregates_daily_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usage_aggregates_daily" ADD CONSTRAINT "usage_aggregates_daily_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "usage_aggregates_monthly" ADD CONSTRAINT "usage_aggregates_monthly_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usage_aggregates_monthly" ADD CONSTRAINT "usage_aggregates_monthly_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quota_policies" ADD CONSTRAINT "quota_policies_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_adjustments" ADD CONSTRAINT "billing_adjustments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "billing_adjustments" ADD CONSTRAINT "billing_adjustments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_adjustments" ADD CONSTRAINT "billing_adjustments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
