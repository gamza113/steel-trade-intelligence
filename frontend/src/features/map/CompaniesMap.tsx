import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import type { Company } from "@stip/shared-types";
import {
  CLUSTER_COLOR,
  CLUSTER_COUNT_LAYER_ID,
  CLUSTER_LAYER_ID,
  CUSTOMER_COLOR,
  MAP_SOURCE_ID,
  SUPPLIER_COLOR,
  UNCLUSTERED_LAYER_ID,
} from "./constants";
import { CompanyMapDrawer } from "./CompanyMapDrawer";
import {
  companyFromProperties,
  companiesToGeoJSON,
  type CompanyFeatureProperties,
} from "./geojson";
import { useCompanies } from "./hooks/useCompanies";
import "mapbox-gl/dist/mapbox-gl.css";

const EMPTY_GEOJSON = companiesToGeoJSON([]);

export function CompaniesMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapLoadedRef = useRef(false);
  const companiesRef = useRef<Company[]>([]);

  const [countryInput, setCountryInput] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [companySearchInput, setCompanySearchInput] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim();

  const { companies, loading, error } = useCompanies({
    country: countryFilter || undefined,
    search: companySearch || undefined,
  });

  companiesRef.current = companies;

  const countryOptions = useMemo(() => {
    const values = new Set<string>();
    for (const company of companies) {
      if (company.country) {
        values.add(company.country);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const companyOptions = useMemo(
    () =>
      [...companies].sort((a, b) =>
        a.company_name.localeCompare(b.company_name),
      ),
    [companies],
  );

  const openCompany = useCallback((company: Company) => {
    setSelectedCompany(company);
    setDrawerOpen(true);

    const map = mapRef.current;
    if (
      map &&
      company.longitude !== null &&
      company.latitude !== null &&
      Number.isFinite(company.longitude) &&
      Number.isFinite(company.latitude)
    ) {
      map.flyTo({
        center: [company.longitude, company.latitude],
        zoom: 10,
        essential: true,
      });
    }
  }, []);

  const handleFeatureClick = useCallback(
    (properties: CompanyFeatureProperties) => {
      const fromList = companiesRef.current.find(
        (company) => company.id === properties.id,
      );
      openCompany(fromList ?? companyFromProperties(properties));
    },
    [openCompany],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCountryFilter(countryInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [countryInput]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCompanySearch(companySearchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [companySearchInput]);

  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [20, 20],
      zoom: 1.4,
      projection: "mercator",
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource(MAP_SOURCE_ID, {
        type: "geojson",
        data: EMPTY_GEOJSON,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: "circle",
        source: MAP_SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": CLUSTER_COLOR,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            10,
            24,
            25,
            30,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: MAP_SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: UNCLUSTERED_LAYER_ID,
        type: "circle",
        source: MAP_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "company_type"],
            "Supplier",
            SUPPLIER_COLOR,
            "Customer",
            CUSTOMER_COLOR,
            "#9e9e9e",
          ],
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", CLUSTER_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature) {
          return;
        }

        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource(MAP_SOURCE_ID) as mapboxgl.GeoJSONSource;
        if (clusterId === undefined) {
          return;
        }

        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === null || zoom === undefined) {
            return;
          }

          const geometry = feature.geometry;
          if (geometry.type !== "Point") {
            return;
          }

          map.easeTo({
            center: geometry.coordinates as [number, number],
            zoom,
          });
        });
      });

      map.on("click", UNCLUSTERED_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature?.properties) {
          return;
        }

        handleFeatureClick(feature.properties as CompanyFeatureProperties);
      });

      for (const layerId of [UNCLUSTERED_LAYER_ID, CLUSTER_LAYER_ID]) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      mapLoadedRef.current = true;
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      mapLoadedRef.current = false;
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, handleFeatureClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) {
      return;
    }

    const source = map.getSource(MAP_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) {
      return;
    }

    source.setData(companiesToGeoJSON(companies));
  }, [companies, mapReady]);

  const handleCountryChange = (value: string | null) => {
    setCountryInput(value ?? "");
  };

  const handleCompanySelect = (company: Company | null) => {
    if (!company) {
      setCompanySearchInput("");
      return;
    }

    setCompanySearchInput(company.company_name);
    openCompany(company);
  };

  if (!mapboxToken) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Set <code>VITE_MAPBOX_ACCESS_TOKEN</code> in your frontend environment to
          display the world map.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      <Box
        ref={mapContainerRef}
        sx={{ width: "100%", height: "100%" }}
        aria-label="World map of steel trade companies"
      />

      <Paper
        elevation={4}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1,
          p: 2,
          width: { xs: "calc(100% - 32px)", sm: 420 },
          display: "grid",
          gap: 1.5,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Steel Trade Map
        </Typography>

        <Autocomplete
          freeSolo
          options={companyOptions}
          value={null}
          inputValue={companySearchInput}
          onInputChange={(_event, value) => setCompanySearchInput(value)}
          onChange={(_event, value) => {
            if (typeof value === "string") {
              setCompanySearchInput(value);
              return;
            }
            handleCompanySelect(value);
          }}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.company_name
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search by company"
              placeholder="Company name"
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />

        <Autocomplete
          freeSolo
          options={countryOptions}
          value={countryInput || null}
          inputValue={countryInput}
          onInputChange={(_event, value) => setCountryInput(value)}
          onChange={(_event, value) => handleCountryChange(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search by country"
              placeholder="Country"
              size="small"
            />
          )}
        />

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading companies…</Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {companies.length} companies
            <Box component="span" sx={{ mx: 1 }}>·</Box>
            <Box component="span" sx={{ color: SUPPLIER_COLOR }}>Supplier</Box>
            <Box component="span" sx={{ mx: 0.5 }}>/</Box>
            <Box component="span" sx={{ color: CUSTOMER_COLOR }}>Customer</Box>
          </Typography>
        )}

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Typography variant="body2">
          <MuiLink component={Link} to="/imports" underline="hover">
            Import Excel master file
          </MuiLink>
          {" · "}
          <MuiLink component={Link} to="/matching" underline="hover">
            Supplier matching
          </MuiLink>
          {" · "}
          <MuiLink component={Link} to="/competitors" underline="hover">
            Competitor analysis
          </MuiLink>
          {" · "}
          <MuiLink component={Link} to="/freight" underline="hover">
            Ocean freight estimator
          </MuiLink>
        </Typography>
      </Paper>

      <CompanyMapDrawer
        open={drawerOpen}
        company={selectedCompany}
        onClose={() => setDrawerOpen(false)}
      />
    </Box>
  );
}
