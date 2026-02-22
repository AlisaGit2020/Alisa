-- ============================================================================
-- Recalculate Property Statistics from Income and Expense tables
-- ============================================================================
-- This script recalculates income and expense statistics from the source tables.
-- It does NOT recalculate balance (which comes from transactions directly).
--
-- Run with: docker exec alisa-postgres psql -U postgres -d alisa -f /path/to/this/file.sql
-- Or copy/paste into a SQL console.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 1: Delete existing income, expense, deposit, withdraw, airbnb_visits statistics (keep balance)
-- ----------------------------------------------------------------------------
DELETE FROM property_statistics
WHERE key IN ('income', 'expense', 'deposit', 'withdraw', 'airbnb_visits');

-- ----------------------------------------------------------------------------
-- Step 2: Insert INCOME statistics from income table
-- Include: standalone income (no transaction) OR income linked to ACCEPTED transactions
-- ----------------------------------------------------------------------------

-- All-time income (year = NULL, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    i."propertyId",
    'income' as key,
    NULL as year,
    NULL as month,
    TO_CHAR(COALESCE(SUM(i."totalAmount"), 0), 'FM999999999999990.00') as value
FROM income i
LEFT JOIN transaction t ON t.id = i."transactionId"
WHERE i."transactionId" IS NULL OR t.status = 2  -- Standalone OR ACCEPTED
GROUP BY i."propertyId";

-- Yearly income (year = X, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    i."propertyId",
    'income' as key,
    EXTRACT(YEAR FROM i."accountingDate")::SMALLINT as year,
    NULL as month,
    TO_CHAR(COALESCE(SUM(i."totalAmount"), 0), 'FM999999999999990.00') as value
FROM income i
LEFT JOIN transaction t ON t.id = i."transactionId"
WHERE i."transactionId" IS NULL OR t.status = 2  -- Standalone OR ACCEPTED
GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate");

-- Monthly income (year = X, month = Y)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    i."propertyId",
    'income' as key,
    EXTRACT(YEAR FROM i."accountingDate")::SMALLINT as year,
    EXTRACT(MONTH FROM i."accountingDate")::SMALLINT as month,
    TO_CHAR(COALESCE(SUM(i."totalAmount"), 0), 'FM999999999999990.00') as value
FROM income i
LEFT JOIN transaction t ON t.id = i."transactionId"
WHERE i."transactionId" IS NULL OR t.status = 2  -- Standalone OR ACCEPTED
GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate"), EXTRACT(MONTH FROM i."accountingDate");

-- ----------------------------------------------------------------------------
-- Step 3: Insert EXPENSE statistics from expense table
-- Include: standalone expense (no transaction) OR expense linked to ACCEPTED transactions
-- Note: Expense values are stored as POSITIVE
-- ----------------------------------------------------------------------------

-- All-time expense (year = NULL, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    e."propertyId",
    'expense' as key,
    NULL as year,
    NULL as month,
    TO_CHAR(COALESCE(SUM(e."totalAmount"), 0), 'FM999999999999990.00') as value
FROM expense e
LEFT JOIN transaction t ON t.id = e."transactionId"
WHERE e."transactionId" IS NULL OR t.status = 2  -- Standalone OR ACCEPTED
GROUP BY e."propertyId";

-- Yearly expense (year = X, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    e."propertyId",
    'expense' as key,
    EXTRACT(YEAR FROM e."accountingDate")::SMALLINT as year,
    NULL as month,
    TO_CHAR(COALESCE(SUM(e."totalAmount"), 0), 'FM999999999999990.00') as value
FROM expense e
LEFT JOIN transaction t ON t.id = e."transactionId"
WHERE e."transactionId" IS NULL OR t.status = 2  -- Standalone OR ACCEPTED
GROUP BY e."propertyId", EXTRACT(YEAR FROM e."accountingDate");

-- Monthly expense (year = X, month = Y)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    e."propertyId",
    'expense' as key,
    EXTRACT(YEAR FROM e."accountingDate")::SMALLINT as year,
    EXTRACT(MONTH FROM e."accountingDate")::SMALLINT as month,
    TO_CHAR(COALESCE(SUM(e."totalAmount"), 0), 'FM999999999999990.00') as value
FROM expense e
LEFT JOIN transaction t ON t.id = e."transactionId"
WHERE e."transactionId" IS NULL OR t.status = 2  -- Standalone OR ACCEPTED
GROUP BY e."propertyId", EXTRACT(YEAR FROM e."accountingDate"), EXTRACT(MONTH FROM e."accountingDate");

-- ----------------------------------------------------------------------------
-- Step 4: Insert DEPOSIT statistics from transaction table
-- Only include ACCEPTED transactions (status = 2) with type = 3 (DEPOSIT)
-- ----------------------------------------------------------------------------

-- All-time deposit (year = NULL, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    t."propertyId",
    'deposit' as key,
    NULL as year,
    NULL as month,
    TO_CHAR(COALESCE(SUM(t.amount), 0), 'FM999999999999990.00') as value
FROM transaction t
WHERE t.status = 2 AND t.type = 3  -- ACCEPTED, DEPOSIT
GROUP BY t."propertyId";

-- Yearly deposit (year = X, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    t."propertyId",
    'deposit' as key,
    EXTRACT(YEAR FROM t."accountingDate")::SMALLINT as year,
    NULL as month,
    TO_CHAR(COALESCE(SUM(t.amount), 0), 'FM999999999999990.00') as value
FROM transaction t
WHERE t.status = 2 AND t.type = 3  -- ACCEPTED, DEPOSIT
GROUP BY t."propertyId", EXTRACT(YEAR FROM t."accountingDate");

-- Monthly deposit (year = X, month = Y)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    t."propertyId",
    'deposit' as key,
    EXTRACT(YEAR FROM t."accountingDate")::SMALLINT as year,
    EXTRACT(MONTH FROM t."accountingDate")::SMALLINT as month,
    TO_CHAR(COALESCE(SUM(t.amount), 0), 'FM999999999999990.00') as value
FROM transaction t
WHERE t.status = 2 AND t.type = 3  -- ACCEPTED, DEPOSIT
GROUP BY t."propertyId", EXTRACT(YEAR FROM t."accountingDate"), EXTRACT(MONTH FROM t."accountingDate");

-- ----------------------------------------------------------------------------
-- Step 5: Insert WITHDRAW statistics from transaction table
-- Only include ACCEPTED transactions (status = 2) with type = 4 (WITHDRAW)
-- Note: Withdraw transaction amounts are negative, but we store as POSITIVE
-- (negate the sum to convert to positive values)
-- ----------------------------------------------------------------------------

-- All-time withdraw (year = NULL, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    t."propertyId",
    'withdraw' as key,
    NULL as year,
    NULL as month,
    TO_CHAR(-COALESCE(SUM(t.amount), 0), 'FM999999999999990.00') as value
FROM transaction t
WHERE t.status = 2 AND t.type = 4  -- ACCEPTED, WITHDRAW
GROUP BY t."propertyId";

-- Yearly withdraw (year = X, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    t."propertyId",
    'withdraw' as key,
    EXTRACT(YEAR FROM t."accountingDate")::SMALLINT as year,
    NULL as month,
    TO_CHAR(-COALESCE(SUM(t.amount), 0), 'FM999999999999990.00') as value
FROM transaction t
WHERE t.status = 2 AND t.type = 4  -- ACCEPTED, WITHDRAW
GROUP BY t."propertyId", EXTRACT(YEAR FROM t."accountingDate");

-- Monthly withdraw (year = X, month = Y)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    t."propertyId",
    'withdraw' as key,
    EXTRACT(YEAR FROM t."accountingDate")::SMALLINT as year,
    EXTRACT(MONTH FROM t."accountingDate")::SMALLINT as month,
    TO_CHAR(-COALESCE(SUM(t.amount), 0), 'FM999999999999990.00') as value
FROM transaction t
WHERE t.status = 2 AND t.type = 4  -- ACCEPTED, WITHDRAW
GROUP BY t."propertyId", EXTRACT(YEAR FROM t."accountingDate"), EXTRACT(MONTH FROM t."accountingDate");

-- ----------------------------------------------------------------------------
-- Step 6: Insert AIRBNB_VISITS statistics from income table
-- Count income records where income type key = 'airbnb'
-- Include: standalone income (no transaction) OR income linked to ACCEPTED transactions
-- ----------------------------------------------------------------------------

-- All-time airbnb visits (year = NULL, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    i."propertyId",
    'airbnb_visits' as key,
    NULL as year,
    NULL as month,
    COUNT(i.id)::TEXT as value
FROM income i
LEFT JOIN transaction t ON t.id = i."transactionId"
INNER JOIN income_type it ON it.id = i."incomeTypeId"
WHERE (i."transactionId" IS NULL OR t.status = 2)  -- Standalone OR ACCEPTED
  AND it.key = 'airbnb'
GROUP BY i."propertyId";

-- Yearly airbnb visits (year = X, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    i."propertyId",
    'airbnb_visits' as key,
    EXTRACT(YEAR FROM i."accountingDate")::SMALLINT as year,
    NULL as month,
    COUNT(i.id)::TEXT as value
FROM income i
LEFT JOIN transaction t ON t.id = i."transactionId"
INNER JOIN income_type it ON it.id = i."incomeTypeId"
WHERE (i."transactionId" IS NULL OR t.status = 2)  -- Standalone OR ACCEPTED
  AND it.key = 'airbnb'
GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate");

-- Monthly airbnb visits (year = X, month = Y)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    i."propertyId",
    'airbnb_visits' as key,
    EXTRACT(YEAR FROM i."accountingDate")::SMALLINT as year,
    EXTRACT(MONTH FROM i."accountingDate")::SMALLINT as month,
    COUNT(i.id)::TEXT as value
FROM income i
LEFT JOIN transaction t ON t.id = i."transactionId"
INNER JOIN income_type it ON it.id = i."incomeTypeId"
WHERE (i."transactionId" IS NULL OR t.status = 2)  -- Standalone OR ACCEPTED
  AND it.key = 'airbnb'
GROUP BY i."propertyId", EXTRACT(YEAR FROM i."accountingDate"), EXTRACT(MONTH FROM i."accountingDate");

-- ----------------------------------------------------------------------------
-- Step 7: Verify results
-- ----------------------------------------------------------------------------
SELECT
    key,
    COUNT(*) as record_count,
    SUM(value::DECIMAL) as total_value
FROM property_statistics
WHERE key IN ('income', 'expense', 'deposit', 'withdraw', 'airbnb_visits')
GROUP BY key
ORDER BY key;

COMMIT;

-- ============================================================================
-- Summary of what this script does:
-- 1. Deletes all existing 'income', 'expense', 'deposit', 'withdraw', 'airbnb_visits' statistics
-- 2. Recalculates income from the income table (all-time, yearly, monthly)
--    - Includes standalone income (no transaction) AND income linked to ACCEPTED transactions
--    - Uses income.accountingDate for date grouping
-- 3. Recalculates expense from the expense table (all-time, yearly, monthly)
--    - Includes standalone expense (no transaction) AND expense linked to ACCEPTED transactions
--    - Uses expense.accountingDate for date grouping
-- 4. Recalculates deposit from transaction table where type=3 (all-time, yearly, monthly)
-- 5. Recalculates withdraw from transaction table where type=4 (all-time, yearly, monthly)
-- 6. Recalculates airbnb_visits by counting income records with income type key='airbnb'
--    - Includes standalone income (no transaction) AND income linked to ACCEPTED transactions
-- 7. Shows a summary of the recalculated statistics
--
-- Note: Standalone income/expense (transactionId IS NULL) are always included.
-- Income/expense linked to transactions are only included if status = 2 (ACCEPTED).
-- All statistic values are stored as POSITIVE numbers (including withdraw).
-- Balance is NOT recalculated by this script.
-- ============================================================================
