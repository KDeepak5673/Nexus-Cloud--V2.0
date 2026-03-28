-- Add INR defaults and new billing metric types

ALTER TYPE "MetricType" ADD VALUE IF NOT EXISTS 'DEPLOYMENT_COUNT';
ALTER TYPE "MetricType" ADD VALUE IF NOT EXISTS 'PROJECT_COUNT';

ALTER TABLE "billing_accounts"
ALTER COLUMN "currency" SET DEFAULT 'INR';

UPDATE "billing_accounts"
SET "currency" = 'INR'
WHERE "currency" = 'USD';

UPDATE "pricing_rules"
SET "included_units" = 1024
WHERE "metric_type" = 'EGRESS_MB' AND "included_units" = 10240;

UPDATE "quota_policies"
SET "monthly_included" = 1024
WHERE "metric_type" = 'EGRESS_MB' AND "monthly_included" = 10240;