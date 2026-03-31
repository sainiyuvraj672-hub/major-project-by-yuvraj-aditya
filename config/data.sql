USE evoting_db;

-- 1. Disable safe mode so we can clear the tables
SET SQL_SAFE_UPDATES = 0;

-- 2. Clear old data
DELETE FROM voting_logs;
DELETE FROM candidates;
DELETE FROM voters;

-- 3. Reset ID counters
ALTER TABLE candidates AUTO_INCREMENT = 1;
ALTER TABLE elections AUTO_INCREMENT = 1;

-- 4. Add your official election
INSERT INTO elections (title) VALUES ('BCA Major Project Election 2026');

-- 5. Re-enable safe mode (Best practice)
SET SQL_SAFE_UPDATES = 1;

-- 6. Show the table to confirm retina_hash is there
DESCRIBE voters;