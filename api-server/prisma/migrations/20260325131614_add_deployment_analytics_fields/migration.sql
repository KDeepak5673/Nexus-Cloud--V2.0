-- AlterTable
ALTER TABLE "Deployement" ADD COLUMN     "deployment_time" INTEGER,
ADD COLUMN     "environment" TEXT DEFAULT 'production',
ADD COLUMN     "finished_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "billing_adjustments_account_id_createdAt_idx" ON "billing_adjustments"("account_id", "createdAt");

-- CreateIndex
CREATE INDEX "invoice_line_items_invoice_id_idx" ON "invoice_line_items"("invoice_id");

-- CreateIndex
CREATE INDEX "payment_events_account_id_createdAt_idx" ON "payment_events"("account_id", "createdAt");

-- CreateIndex
CREATE INDEX "pricing_rules_account_id_metric_type_active_from_idx" ON "pricing_rules"("account_id", "metric_type", "active_from");

-- CreateIndex
CREATE INDEX "usage_aggregates_daily_account_id_bucket_date_idx" ON "usage_aggregates_daily"("account_id", "bucket_date");

-- CreateIndex
CREATE INDEX "usage_aggregates_hourly_account_id_bucket_start_idx" ON "usage_aggregates_hourly"("account_id", "bucket_start");

-- CreateIndex
CREATE INDEX "usage_aggregates_monthly_account_id_month_start_idx" ON "usage_aggregates_monthly"("account_id", "month_start");

-- RenameIndex
ALTER INDEX "usage_aggregates_daily_unique" RENAME TO "usage_aggregates_daily_account_id_project_id_metric_type_bu_key";

-- RenameIndex
ALTER INDEX "usage_aggregates_hourly_unique" RENAME TO "usage_aggregates_hourly_account_id_project_id_metric_type_b_key";

-- RenameIndex
ALTER INDEX "usage_aggregates_monthly_unique" RENAME TO "usage_aggregates_monthly_account_id_project_id_metric_type__key";
