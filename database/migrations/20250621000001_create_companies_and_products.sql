-- Companies and Products — first production domain model
-- Requires: PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE company_type AS ENUM ('Supplier', 'Customer');

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  company_type company_type NOT NULL,
  country TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  port_name TEXT,
  website TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT companies_latitude_range CHECK (
    latitude IS NULL OR latitude >= -90 AND latitude <= 90
  ),
  CONSTRAINT companies_longitude_range CHECK (
    longitude IS NULL OR longitude >= -180 AND longitude <= 180
  )
);

CREATE INDEX idx_companies_company_type ON companies (company_type);
CREATE INDEX idx_companies_country ON companies (country);
CREATE INDEX idx_companies_company_name ON companies (company_name);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  product_category TEXT NOT NULL,
  steel_grade TEXT NOT NULL,
  thickness_min NUMERIC(12, 4),
  thickness_max NUMERIC(12, 4),
  width_min NUMERIC(12, 4),
  width_max NUMERIC(12, 4),
  length_min NUMERIC(12, 4),
  length_max NUMERIC(12, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_thickness_range CHECK (
    thickness_min IS NULL
    OR thickness_max IS NULL
    OR thickness_min <= thickness_max
  ),
  CONSTRAINT products_width_range CHECK (
    width_min IS NULL OR width_max IS NULL OR width_min <= width_max
  ),
  CONSTRAINT products_length_range CHECK (
    length_min IS NULL OR length_max IS NULL OR length_min <= length_max
  ),
  CONSTRAINT products_positive_thickness_min CHECK (
    thickness_min IS NULL OR thickness_min >= 0
  ),
  CONSTRAINT products_positive_thickness_max CHECK (
    thickness_max IS NULL OR thickness_max >= 0
  ),
  CONSTRAINT products_positive_width_min CHECK (
    width_min IS NULL OR width_min >= 0
  ),
  CONSTRAINT products_positive_width_max CHECK (
    width_max IS NULL OR width_max >= 0
  ),
  CONSTRAINT products_positive_length_min CHECK (
    length_min IS NULL OR length_min >= 0
  ),
  CONSTRAINT products_positive_length_max CHECK (
    length_max IS NULL OR length_max >= 0
  )
);

CREATE INDEX idx_products_company_id ON products (company_id);
CREATE INDEX idx_products_steel_grade ON products (steel_grade);
CREATE INDEX idx_products_product_category ON products (product_category);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();
