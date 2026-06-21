-- Ports — geography reference entity for steel trade logistics

CREATE TABLE ports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  port_name TEXT NOT NULL,
  country TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  un_locode TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ports_latitude_range CHECK (
    latitude IS NULL OR latitude >= -90 AND latitude <= 90
  ),
  CONSTRAINT ports_longitude_range CHECK (
    longitude IS NULL OR longitude >= -180 AND longitude <= 180
  ),
  CONSTRAINT ports_un_locode_format CHECK (
    un_locode IS NULL OR un_locode ~ '^[A-Z]{2}[A-Z0-9]{3}$'
  )
);

CREATE UNIQUE INDEX idx_ports_un_locode ON ports (un_locode) WHERE un_locode IS NOT NULL;
CREATE INDEX idx_ports_port_name ON ports (port_name);
CREATE INDEX idx_ports_country ON ports (country);
CREATE INDEX idx_ports_city ON ports (city);

CREATE TRIGGER ports_set_updated_at
  BEFORE UPDATE ON ports
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();
