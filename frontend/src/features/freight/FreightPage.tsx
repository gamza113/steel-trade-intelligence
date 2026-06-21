import { useEffect, useState } from "react";
import CalculateIcon from "@mui/icons-material/Calculate";
import {
  Alert,
  Box,
  Button,
  Container,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import type { Company, FreightEstimateResult, VesselType } from "@stip/shared-types";
import { estimateFreight, fetchAllCompanies } from "@/shared/lib";

const VESSEL_TYPES: VesselType[] = [
  "Handysize",
  "Handymax",
  "Supramax",
  "Panamax",
  "Capesize",
];

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function FreightPage() {
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [supplierId, setSupplierId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [cargoWeightMt, setCargoWeightMt] = useState("25000");
  const [vesselType, setVesselType] = useState<VesselType>("Panamax");
  const [vesselSpeedKnots, setVesselSpeedKnots] = useState("");
  const [dailyFuelConsumptionMt, setDailyFuelConsumptionMt] = useState("");
  const [bunkerPriceUsdPerMt, setBunkerPriceUsdPerMt] = useState("");
  const [dailyCharterRateUsd, setDailyCharterRateUsd] = useState("");
  const [portChargesUsd, setPortChargesUsd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FreightEstimateResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCompanies() {
      try {
        const companies = await fetchAllCompanies();
        if (!cancelled) {
          setSuppliers(
            companies.filter((company) => company.company_type === "Supplier"),
          );
          setCustomers(
            companies.filter((company) => company.company_type === "Customer"),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load companies",
          );
        }
      } finally {
        if (!cancelled) {
          setCompaniesLoading(false);
        }
      }
    }

    loadCompanies();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEstimate = async () => {
    if (!supplierId || !customerId) {
      setError("Select both a supplier and a customer.");
      return;
    }

    const weight = Number(cargoWeightMt);
    if (!Number.isFinite(weight) || weight <= 0) {
      setError("Cargo weight must be a positive number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: Record<string, string | number> = {
        supplier_company_id: supplierId,
        customer_company_id: customerId,
        cargo_weight_mt: weight,
        vessel_type: vesselType,
      };

      if (vesselSpeedKnots.trim()) {
        input.vessel_speed_knots = Number(vesselSpeedKnots);
      }
      if (dailyFuelConsumptionMt.trim()) {
        input.daily_fuel_consumption_mt = Number(dailyFuelConsumptionMt);
      }
      if (bunkerPriceUsdPerMt.trim()) {
        input.bunker_price_usd_per_mt = Number(bunkerPriceUsdPerMt);
      }
      if (dailyCharterRateUsd.trim()) {
        input.daily_charter_rate_usd = Number(dailyCharterRateUsd);
      }
      if (portChargesUsd.trim()) {
        input.port_charges_usd = Number(portChargesUsd);
      }

      const estimate = await estimateFreight(input);
      setResult(estimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Freight estimation failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const breakdownRows = result
    ? [
        { label: "Origin port", value: result.origin_port },
        { label: "Destination port", value: result.destination_port },
        {
          label: "Distance (nm)",
          value: formatNumber(result.distance_nm, 1),
        },
        {
          label: "Voyage days",
          value: formatNumber(result.voyage_days, 2),
        },
        {
          label: "Vessel speed (knots)",
          value: formatNumber(result.vessel_speed_knots, 1),
        },
        {
          label: "Bunker cost",
          value: formatUsd(result.bunker_cost_usd),
        },
        {
          label: "Charter cost",
          value: formatUsd(result.charter_cost_usd),
        },
        {
          label: "Port charges",
          value: formatUsd(result.port_charges_usd),
        },
        {
          label: "Total estimated freight",
          value: formatUsd(result.total_estimated_freight_usd),
          highlight: true,
        },
        {
          label: "Freight per MT",
          value: formatUsd(result.freight_per_mt_usd),
          highlight: true,
        },
      ]
    : [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <MuiLink component={Link} to="/" underline="hover">
            Back to map dashboard
          </MuiLink>
          <Typography variant="h4" sx={{ mt: 1 }}>
            Ocean Freight Estimator
          </Typography>
          <Typography color="text.secondary">
            Estimate ocean freight between supplier and customer ports using
            great-circle sea distance, voyage time, bunker, charter, and port
            charges.
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField
              select
              required
              label="Supplier company"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              disabled={companiesLoading}
            >
              <MenuItem value="">
                <em>Select supplier</em>
              </MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.company_name}
                  {supplier.port?.port_name
                    ? ` — ${supplier.port.port_name}`
                    : supplier.port_name
                      ? ` — ${supplier.port_name}`
                      : ""}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              required
              label="Customer company"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              disabled={companiesLoading}
            >
              <MenuItem value="">
                <em>Select customer</em>
              </MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.company_name}
                  {customer.port?.port_name
                    ? ` — ${customer.port.port_name}`
                    : customer.port_name
                      ? ` — ${customer.port_name}`
                      : ""}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                required
                label="Cargo weight (MT)"
                type="number"
                value={cargoWeightMt}
                onChange={(event) => setCargoWeightMt(event.target.value)}
                fullWidth
              />
              <TextField
                select
                required
                label="Vessel type"
                value={vesselType}
                onChange={(event) =>
                  setVesselType(event.target.value as VesselType)
                }
                fullWidth
              >
                {VESSEL_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Vessel speed (knots)"
                type="number"
                value={vesselSpeedKnots}
                onChange={(event) => setVesselSpeedKnots(event.target.value)}
                fullWidth
                helperText="Optional — defaults by vessel type"
              />
              <TextField
                label="Daily fuel consumption (MT)"
                type="number"
                value={dailyFuelConsumptionMt}
                onChange={(event) => setDailyFuelConsumptionMt(event.target.value)}
                fullWidth
                helperText="Optional"
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Bunker price (USD/MT)"
                type="number"
                value={bunkerPriceUsdPerMt}
                onChange={(event) => setBunkerPriceUsdPerMt(event.target.value)}
                fullWidth
                helperText="Optional — default $550/MT"
              />
              <TextField
                label="Daily charter rate (USD)"
                type="number"
                value={dailyCharterRateUsd}
                onChange={(event) => setDailyCharterRateUsd(event.target.value)}
                fullWidth
                helperText="Optional — defaults by vessel type"
              />
            </Stack>

            <TextField
              label="Port charges (USD)"
              type="number"
              value={portChargesUsd}
              onChange={(event) => setPortChargesUsd(event.target.value)}
              helperText="Optional — default $35,000 total"
            />

            <Button
              variant="contained"
              startIcon={<CalculateIcon />}
              onClick={handleEstimate}
              disabled={loading || !supplierId || !customerId}
            >
              {loading ? "Calculating…" : "Estimate freight"}
            </Button>
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        {result && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Freight estimate
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {result.supplier_company_name} → {result.customer_company_name} ·{" "}
              {result.vessel_type} · {formatNumber(result.cargo_weight_mt, 0)} MT
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {breakdownRows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell
                        sx={row.highlight ? { fontWeight: 600 } : undefined}
                      >
                        {row.label}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={row.highlight ? { fontWeight: 600 } : undefined}
                      >
                        {row.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
