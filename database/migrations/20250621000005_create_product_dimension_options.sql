-- Discrete dimension options for steel matching (e.g. 220 / 260 / 300)

CREATE TYPE dimension_type AS ENUM ('thickness', 'width', 'length');

CREATE TABLE product_dimension_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  dimension_type dimension_type NOT NULL,
  value NUMERIC(12, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_dimension_options_positive_value CHECK (value >= 0),
  UNIQUE (product_id, dimension_type, value)
);

CREATE INDEX idx_product_dimension_options_product_id
  ON product_dimension_options (product_id);

CREATE INDEX idx_product_dimension_options_type_value
  ON product_dimension_options (dimension_type, value);

-- Backfill: single-value dimensions (min = max)
INSERT INTO product_dimension_options (product_id, dimension_type, value)
SELECT id, 'thickness', thickness_min
FROM products
WHERE thickness_min IS NOT NULL
  AND thickness_max IS NOT NULL
  AND thickness_min = thickness_max
ON CONFLICT (product_id, dimension_type, value) DO NOTHING;

INSERT INTO product_dimension_options (product_id, dimension_type, value)
SELECT id, 'width', width_min
FROM products
WHERE width_min IS NOT NULL
  AND width_max IS NOT NULL
  AND width_min = width_max
ON CONFLICT (product_id, dimension_type, value) DO NOTHING;

INSERT INTO product_dimension_options (product_id, dimension_type, value)
SELECT id, 'length', length_min
FROM products
WHERE length_min IS NOT NULL
  AND length_max IS NOT NULL
  AND length_min = length_max
ON CONFLICT (product_id, dimension_type, value) DO NOTHING;

-- Backfill: distinct min/max endpoints for legacy range rows
INSERT INTO product_dimension_options (product_id, dimension_type, value)
SELECT id, 'thickness', thickness_min
FROM products
WHERE thickness_min IS NOT NULL
  AND thickness_max IS NOT NULL
  AND thickness_min <> thickness_max
ON CONFLICT (product_id, dimension_type, value) DO NOTHING;

INSERT INTO product_dimension_options (product_id, dimension_type, value)
SELECT id, 'thickness', thickness_max
FROM products
WHERE thickness_min IS NOT NULL
  AND thickness_max IS NOT NULL
  AND thickness_min <> thickness_max
ON CONFLICT (product_id, dimension_type, value) DO NOTHING;

INSERT INTO product_dimension_options (product_id, dimension_type, value)
SELECT id, 'width', width_min
FROM products
WHERE width_min IS NOT NULL
  AND width_max IS NOT NULL
  AND width_min <> width_max
ON CONFLICT (product_id, dimension_type, value) DO NOTHING;

INSERT INTO product_dimension_options (product_id, dimension_type, value)
SELECT id, 'width', width_max
FROM products
WHERE width_min IS NOT NULL
  AND width_max IS NOT NULL
  AND width_min <> width_max
ON CONFLICT (product_id, dimension_type, value) DO NOTHING;

INSERT INTO product_dimension_options (product_id, dimension_type, value)
SELECT id, 'length', length_min
FROM products
WHERE length_min IS NOT NULL
  AND length_max IS NOT NULL
  AND length_min <> length_max
ON CONFLICT (product_id, dimension_type, value) DO NOTHING;

INSERT INTO product_dimension_options (product_id, dimension_type, value)
SELECT id, 'length', length_max
FROM products
WHERE length_min IS NOT NULL
  AND length_max IS NOT NULL
  AND length_min <> length_max
ON CONFLICT (product_id, dimension_type, value) DO NOTHING;
