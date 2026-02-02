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
-- Step 1: Delete existing income, expense, deposit, withdraw statistics (keep balance)
-- ----------------------------------------------------------------------------
DELETE FROM property_statistics
WHERE key IN ('income', 'expense', 'deposit', 'withdraw');

-- ----------------------------------------------------------------------------
-- Step 2: Insert INCOME statistics from income table
-- Only include income linked to ACCEPTED transactions (status = 2)
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
INNER JOIN transaction t ON t.id = i."transactionId"
WHERE t.status = 2  -- ACCEPTED
GROUP BY i."propertyId";

-- Yearly income (year = X, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    i."propertyId",
    'income' as key,
    EXTRACT(YEAR FROM t."accountingDate")::SMALLINT as year,
    NULL as month,
    TO_CHAR(COALESCE(SUM(i."totalAmount"), 0), 'FM999999999999990.00') as value
FROM income i
INNER JOIN transaction t ON t.id = i."transactionId"
WHERE t.status = 2  -- ACCEPTED
GROUP BY i."propertyId", EXTRACT(YEAR FROM t."accountingDate");

-- Monthly income (year = X, month = Y)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    i."propertyId",
    'income' as key,
    EXTRACT(YEAR FROM t."accountingDate")::SMALLINT as year,
    EXTRACT(MONTH FROM t."accountingDate")::SMALLINT as month,
    TO_CHAR(COALESCE(SUM(i."totalAmount"), 0), 'FM999999999999990.00') as value
FROM income i
INNER JOIN transaction t ON t.id = i."transactionId"
WHERE t.status = 2  -- ACCEPTED
GROUP BY i."propertyId", EXTRACT(YEAR FROM t."accountingDate"), EXTRACT(MONTH FROM t."accountingDate");

-- ----------------------------------------------------------------------------
-- Step 3: Insert EXPENSE statistics from expense table
-- Only include expense linked to ACCEPTED transactions (status = 2)
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
INNER JOIN transaction t ON t.id = e."transactionId"
WHERE t.status = 2  -- ACCEPTED
GROUP BY e."propertyId";

-- Yearly expense (year = X, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    e."propertyId",
    'expense' as key,
    EXTRACT(YEAR FROM t."accountingDate")::SMALLINT as year,
    NULL as month,
    TO_CHAR(COALESCE(SUM(e."totalAmount"), 0), 'FM999999999999990.00') as value
FROM expense e
INNER JOIN transaction t ON t.id = e."transactionId"
WHERE t.status = 2  -- ACCEPTED
GROUP BY e."propertyId", EXTRACT(YEAR FROM t."accountingDate");

-- Monthly expense (year = X, month = Y)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    e."propertyId",
    'expense' as key,
    EXTRACT(YEAR FROM t."accountingDate")::SMALLINT as year,
    EXTRACT(MONTH FROM t."accountingDate")::SMALLINT as month,
    TO_CHAR(COALESCE(SUM(e."totalAmount"), 0), 'FM999999999999990.00') as value
FROM expense e
INNER JOIN transaction t ON t.id = e."transactionId"
WHERE t.status = 2  -- ACCEPTED
GROUP BY e."propertyId", EXTRACT(YEAR FROM t."accountingDate"), EXTRACT(MONTH FROM t."accountingDate");

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
-- Note: Withdraw values are stored as NEGATIVE
-- ----------------------------------------------------------------------------

-- All-time withdraw (year = NULL, month = NULL)
INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
SELECT
    t."propertyId",
    'withdraw' as key,
    NULL as year,
    NULL as month,
    TO_CHAR(COALESCE(SUM(t.amount), 0), 'FM999999999999990.00') as value
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
    TO_CHAR(COALESCE(SUM(t.amount), 0), 'FM999999999999990.00') as value
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
    TO_CHAR(COALESCE(SUM(t.amount), 0), 'FM999999999999990.00') as value
FROM transaction t
WHERE t.status = 2 AND t.type = 4  -- ACCEPTED, WITHDRAW
GROUP BY t."propertyId", EXTRACT(YEAR FROM t."accountingDate"), EXTRACT(MONTH FROM t."accountingDate");

-- ----------------------------------------------------------------------------
-- Step 6: Verify results
-- ----------------------------------------------------------------------------
SELECT
    key,
    COUNT(*) as record_count,
    SUM(value::DECIMAL) as total_value
FROM property_statistics
WHERE key IN ('income', 'expense', 'deposit', 'withdraw')
GROUP BY key
ORDER BY key;

COMMIT;

-- ============================================================================
-- Summary of what this script does:
-- 1. Deletes all existing 'income', 'expense', 'deposit', 'withdraw' statistics
-- 2. Recalculates income from the income table (all-time, yearly, monthly)
-- 3. Recalculates expense from the expense table (all-time, yearly, monthly)
-- 4. Recalculates deposit from transaction table where type=3 (all-time, yearly, monthly)
-- 5. Recalculates withdraw from transaction table where type=4 (all-time, yearly, monthly)
-- 6. Shows a summary of the recalculated statistics
--
-- Note: Only transactions with status = 2 (ACCEPTED) are included.
-- Withdraw values are stored as negative numbers. Expense values are positive.
-- Balance is NOT recalculated by this script.
-- ============================================================================
