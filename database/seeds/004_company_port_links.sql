-- Link sample companies to reference ports where applicable

UPDATE companies
SET port_id = 'c3000003-0003-4000-8000-000000000002'
WHERE id = 'a1000001-0001-4000-8000-000000000002'
  AND port_id IS NULL;
