-- ============================================================================
-- Fix Timezone-Shifted Dates Migration Script
-- ============================================================================
--
-- Problem: When users in UTC+2/UTC+3 (Finland) selected a date like 01.01.2025,
-- the frontend sent it as 2024-12-31T22:00:00Z (winter) or 2024-12-31T21:00:00Z
-- (summer), which was stored as-is. This caused transactions to appear in
-- December 2024 instead of January 2025.
--
-- Solution: For any date with UTC hour >= 21, round up to the next day at midnight.
-- Threshold of 21 covers both UTC+2 (winter) and UTC+3 (summer) timezones.
--
-- Usage:
--   psql -h localhost -U your_user -d your_database -f fix-timezone-shifted-dates.sql
--
-- IMPORTANT: After running this script, recalculate statistics for all users
-- using the /api/real-estate/property/statistics/recalculate endpoint.
-- ============================================================================

BEGIN;

-- Preview: Show affected records before fixing
SELECT 'transaction.transactionDate' AS table_column, COUNT(*) AS affected_count
FROM transaction
WHERE EXTRACT(HOUR FROM "transactionDate") >= 21;

SELECT 'transaction.accountingDate' AS table_column, COUNT(*) AS affected_count
FROM transaction
WHERE EXTRACT(HOUR FROM "accountingDate") >= 21;

SELECT 'income.accountingDate' AS table_column, COUNT(*) AS affected_count
FROM income
WHERE "accountingDate" IS NOT NULL
  AND EXTRACT(HOUR FROM "accountingDate") >= 21;

SELECT 'expense.accountingDate' AS table_column, COUNT(*) AS affected_count
FROM expense
WHERE "accountingDate" IS NOT NULL
  AND EXTRACT(HOUR FROM "accountingDate") >= 21;

-- Fix transaction.transactionDate
UPDATE transaction
SET "transactionDate" = date_trunc('day', "transactionDate" + interval '1 day')
WHERE EXTRACT(HOUR FROM "transactionDate") >= 21;

-- Fix transaction.accountingDate
UPDATE transaction
SET "accountingDate" = date_trunc('day', "accountingDate" + interval '1 day')
WHERE EXTRACT(HOUR FROM "accountingDate") >= 21;

-- Fix income.accountingDate
UPDATE income
SET "accountingDate" = date_trunc('day', "accountingDate" + interval '1 day')
WHERE "accountingDate" IS NOT NULL
  AND EXTRACT(HOUR FROM "accountingDate") >= 21;

-- Fix expense.accountingDate
UPDATE expense
SET "accountingDate" = date_trunc('day', "accountingDate" + interval '1 day')
WHERE "accountingDate" IS NOT NULL
  AND EXTRACT(HOUR FROM "accountingDate") >= 21;

-- Verify: Show remaining records with hour >= 21 (should be 0)
SELECT 'VERIFICATION - Remaining affected records:' AS message;

SELECT 'transaction.transactionDate' AS table_column, COUNT(*) AS remaining_count
FROM transaction
WHERE EXTRACT(HOUR FROM "transactionDate") >= 21;

SELECT 'transaction.accountingDate' AS table_column, COUNT(*) AS remaining_count
FROM transaction
WHERE EXTRACT(HOUR FROM "accountingDate") >= 21;

SELECT 'income.accountingDate' AS table_column, COUNT(*) AS remaining_count
FROM income
WHERE "accountingDate" IS NOT NULL
  AND EXTRACT(HOUR FROM "accountingDate") >= 21;

SELECT 'expense.accountingDate' AS table_column, COUNT(*) AS remaining_count
FROM expense
WHERE "accountingDate" IS NOT NULL
  AND EXTRACT(HOUR FROM "accountingDate") >= 21;

COMMIT;

-- ============================================================================
-- NEXT STEPS:
-- 1. Recalculate property statistics for all users
-- 2. You can do this by calling the API endpoint for each user:
--    POST /api/real-estate/property/statistics/recalculate
-- ============================================================================
