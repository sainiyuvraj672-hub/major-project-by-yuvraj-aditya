-- 1. Unlock the database safety switch
SET SQL_SAFE_UPDATES = 0;

-- 2. Wipe all old/messy data from all tables
DELETE FROM voting_logs;
DELETE FROM candidates;
DELETE FROM voters;
DELETE FROM elections;

-- 3. Reset the counters so IDs start at 1 again
ALTER TABLE elections AUTO_INCREMENT = 1;
ALTER TABLE candidates AUTO_INCREMENT = 1;

-- 4. Create your first REAL election (this will be ID 1)
INSERT INTO elections (title) VALUES ('BCA Major Project Election 2026');

-- 5. Relock the safety switch
SET SQL_SAFE_UPDATES = 1;

-- 6. Verify the clean slate
SELECT * FROM elections;