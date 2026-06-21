-- Sample companies and products for development

INSERT INTO companies (
  id,
  company_name,
  company_type,
  country,
  city,
  latitude,
  longitude,
  port_name,
  website,
  remarks
) VALUES
  (
    'a1000001-0001-4000-8000-000000000001',
    'Nippon Steel Trading',
    'Supplier',
    'Japan',
    'Tokyo',
    35.6762,
    139.6503,
    'Tokyo Port',
    'https://www.nipponsteel.com',
    'Major integrated steel supplier; hot-rolled and cold-rolled coils.'
  ),
  (
    'a1000001-0001-4000-8000-000000000002',
    'POSCO International',
    'Supplier',
    'South Korea',
    'Pohang',
    36.0190,
    129.3435,
    'Pohang Port',
    'https://www.posco.com',
    'Wide product range including plate and structural steel.'
  ),
  (
    'a1000001-0001-4000-8000-000000000003',
    'European Steel Buyers GmbH',
    'Customer',
    'Germany',
    'Hamburg',
    53.5511,
    9.9937,
    'Hamburg Port',
    'https://example-steel-buyers.de',
    'Automotive and construction sector buyer.'
  ),
  (
    'a1000001-0001-4000-8000-000000000004',
    'Gulf Fabrication LLC',
    'Customer',
    'United Arab Emirates',
    'Dubai',
    25.2048,
    55.2708,
    'Jebel Ali Port',
    NULL,
    'Fabrication yard; regular HRC and plate requirements.'
  );

INSERT INTO products (
  id,
  company_id,
  product_category,
  steel_grade,
  thickness_min,
  thickness_max,
  width_min,
  width_max,
  length_min,
  length_max
) VALUES
  (
    'b2000002-0002-4000-8000-000000000001',
    'a1000001-0001-4000-8000-000000000001',
    'Hot Rolled Coil',
    'SS400',
    1.5000,
    12.0000,
    900.0000,
    2000.0000,
    NULL,
    NULL
  ),
  (
    'b2000002-0002-4000-8000-000000000002',
    'a1000001-0001-4000-8000-000000000001',
    'Cold Rolled Coil',
    'SPCC',
    0.4000,
    3.0000,
    600.0000,
    1500.0000,
    NULL,
    NULL
  ),
  (
    'b2000002-0002-4000-8000-000000000003',
    'a1000001-0001-4000-8000-000000000002',
    'Plate',
    'A36',
    6.0000,
    50.0000,
    1500.0000,
    3000.0000,
    6000.0000,
    12000.0000
  ),
  (
    'b2000002-0002-4000-8000-000000000004',
    'a1000001-0001-4000-8000-000000000002',
    'Hot Rolled Coil',
    'SM490',
    2.0000,
    16.0000,
    1000.0000,
    2100.0000,
    NULL,
    NULL
  );
