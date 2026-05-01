-- Step 1: full wipe (delete all KRs, company OKRs, and area OKRs to reload from scratch)
DELETE FROM key_results;
DELETE FROM company_okrs;
DELETE FROM okr_areas;