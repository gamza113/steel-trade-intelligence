-- Reference port data for steel trade logistics

INSERT INTO ports (
  id,
  port_name,
  country,
  city,
  latitude,
  longitude,
  un_locode,
  remarks
) VALUES
  (
    'c3000003-0003-4000-8000-000000000001',
    'Busan',
    'South Korea',
    'Busan',
    35.1796,
    129.0756,
    'KRPUS',
    'Major East Asian export hub for steel and containers.'
  ),
  (
    'c3000003-0003-4000-8000-000000000002',
    'Gwangyang',
    'South Korea',
    'Gwangyang',
    34.9400,
    127.7000,
    'KRKAN',
    'POSCO Gwangyang steelworks deep-water port.'
  ),
  (
    'c3000003-0003-4000-8000-000000000003',
    'Rotterdam',
    'Netherlands',
    'Rotterdam',
    51.9225,
    4.4792,
    'NLRTM',
    'Europe''s largest port; key steel import and distribution gateway.'
  ),
  (
    'c3000003-0003-4000-8000-000000000004',
    'Antwerp',
    'Belgium',
    'Antwerp',
    51.2194,
    4.4025,
    'BEANR',
    'Major European steel handling and storage port.'
  ),
  (
    'c3000003-0003-4000-8000-000000000005',
    'Shanghai',
    'China',
    'Shanghai',
    31.2304,
    121.4737,
    'CNSHA',
    'China''s busiest port; significant steel throughput.'
  ),
  (
    'c3000003-0003-4000-8000-000000000006',
    'Tianjin',
    'China',
    'Tianjin',
    39.0842,
    117.2010,
    'CNTNJ',
    'Northern China steel export and bulk cargo port.'
  ),
  (
    'c3000003-0003-4000-8000-000000000007',
    'Los Angeles',
    'United States',
    'Los Angeles',
    33.7405,
    -118.2720,
    'USLAX',
    'West Coast US gateway for imported steel products.'
  )
ON CONFLICT (id) DO NOTHING;
