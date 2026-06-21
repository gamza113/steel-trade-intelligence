-- Link companies to ports reference table

ALTER TABLE companies
  ADD COLUMN port_id UUID REFERENCES ports (id) ON DELETE SET NULL;

CREATE INDEX idx_companies_port_id ON companies (port_id);
