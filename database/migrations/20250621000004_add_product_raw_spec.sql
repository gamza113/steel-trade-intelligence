-- Raw dimension text from Excel imports when parsing is ambiguous

ALTER TABLE products
  ADD COLUMN thickness_raw TEXT,
  ADD COLUMN width_raw TEXT,
  ADD COLUMN length_raw TEXT,
  ADD COLUMN remarks TEXT;
