ALTER TABLE "billing_accounts" RENAME COLUMN "budget_soft_limit_usd" TO "budget_soft_limit_inr";
ALTER TABLE "billing_accounts" RENAME COLUMN "budget_hard_limit_usd" TO "budget_hard_limit_inr";

UPDATE "billing_accounts"
SET "budget_soft_limit_inr" = "budget_soft_limit_inr" * 83,
	"budget_hard_limit_inr" = "budget_hard_limit_inr" * 83
WHERE "budget_soft_limit_inr" IS NOT NULL OR "budget_hard_limit_inr" IS NOT NULL;

ALTER TABLE "usage_aggregates_hourly" RENAME COLUMN "unit_cost_usd" TO "unit_cost_inr";
ALTER TABLE "usage_aggregates_hourly" RENAME COLUMN "cost_usd" TO "cost_inr";

UPDATE "usage_aggregates_hourly"
SET "unit_cost_inr" = "unit_cost_inr" * 83,
	"cost_inr" = "cost_inr" * 83;

ALTER TABLE "usage_aggregates_daily" RENAME COLUMN "unit_cost_usd" TO "unit_cost_inr";
ALTER TABLE "usage_aggregates_daily" RENAME COLUMN "cost_usd" TO "cost_inr";

UPDATE "usage_aggregates_daily"
SET "unit_cost_inr" = "unit_cost_inr" * 83,
	"cost_inr" = "cost_inr" * 83;

ALTER TABLE "usage_aggregates_monthly" RENAME COLUMN "unit_cost_usd" TO "unit_cost_inr";
ALTER TABLE "usage_aggregates_monthly" RENAME COLUMN "cost_usd" TO "cost_inr";

UPDATE "usage_aggregates_monthly"
SET "unit_cost_inr" = "unit_cost_inr" * 83,
	"cost_inr" = "cost_inr" * 83;

ALTER TABLE "pricing_rules" RENAME COLUMN "unit_price_usd" TO "unit_price_inr";

UPDATE "pricing_rules"
SET "unit_price_inr" = "unit_price_inr" * 83;

ALTER TABLE "invoices" RENAME COLUMN "subtotal_usd" TO "subtotal_inr";
ALTER TABLE "invoices" RENAME COLUMN "tax_usd" TO "tax_inr";
ALTER TABLE "invoices" RENAME COLUMN "total_usd" TO "total_inr";

UPDATE "invoices"
SET "subtotal_inr" = "subtotal_inr" * 83,
	"tax_inr" = "tax_inr" * 83,
	"total_inr" = "total_inr" * 83;

ALTER TABLE "invoice_line_items" RENAME COLUMN "unit_price_usd" TO "unit_price_inr";
ALTER TABLE "invoice_line_items" RENAME COLUMN "amount_usd" TO "amount_inr";

UPDATE "invoice_line_items"
SET "unit_price_inr" = "unit_price_inr" * 83,
	"amount_inr" = "amount_inr" * 83;

ALTER TABLE "payment_events" RENAME COLUMN "amount_usd" TO "amount_inr";

UPDATE "payment_events"
SET "amount_inr" = "amount_inr" * 83
WHERE "amount_inr" IS NOT NULL;

ALTER TABLE "billing_adjustments" RENAME COLUMN "amount_usd" TO "amount_inr";

UPDATE "billing_adjustments"
SET "amount_inr" = "amount_inr" * 83;
