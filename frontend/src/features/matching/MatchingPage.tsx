import { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Link as MuiLink,
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
  MenuItem,
  Tooltip,
} from "@mui/material";
import { Link } from "react-router-dom";
import type { Company, SupplierMatchResult } from "@stip/shared-types";
import { fetchAllCompanies, searchSupplierMatches } from "@/shared/lib";

function formatDimensions(result: SupplierMatchResult): string {
  return result.matched_dimensions
    .filter((detail) => detail.match_type !== "not_requested")
    .map((detail) => {
      const label = detail.dimension_type;
      if (detail.match_type === "flexible") {
        return `${label}: flexible`;
      }
      if (detail.matched_value !== null) {
        return `${label}: ${detail.matched_value}`;
      }
      return `${label}: —`;
    })
    .join(" · ");
}

function ScoreBreakdownTooltip({ result }: { result: SupplierMatchResult }) {
  const breakdown = result.score_breakdown;
  return (
    <Stack spacing={0.5} sx={{ p: 0.5 }}>
      <Typography variant="caption">
        Dimension: {Math.round(breakdown.dimension * 100)}% (35%)
      </Typography>
      <Typography variant="caption">
        Steel grade: {Math.round(breakdown.steel_grade * 100)}% (25%)
      </Typography>
      <Typography variant="caption">
        Category: {Math.round(breakdown.product_category * 100)}% (20%)
      </Typography>
      <Typography variant="caption">
        Geographic: {Math.round(breakdown.geographic * 100)}% (15%)
      </Typography>
      <Typography variant="caption">
        Remarks: {Math.round(breakdown.remarks * 100)}% (5%)
      </Typography>
      <Typography variant="caption" fontWeight={600}>
        Total: {Math.round(breakdown.total * 100)}%
      </Typography>
    </Stack>
  );
}

export function MatchingPage() {
  const [customers, setCustomers] = useState<Company[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [steelGrade, setSteelGrade] = useState("");
  const [thickness, setThickness] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demandSummary, setDemandSummary] = useState<string | null>(null);
  const [results, setResults] = useState<SupplierMatchResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      try {
        const companies = await fetchAllCompanies();
        if (!cancelled) {
          setCustomers(
            companies.filter((company) => company.company_type === "Customer"),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load customers",
          );
        }
      } finally {
        if (!cancelled) {
          setCustomersLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const input: Record<string, string | number> = {};

      if (customerId) {
        input.customer_id = customerId;
      }
      if (productCategory.trim()) {
        input.product_category = productCategory.trim();
      }
      if (steelGrade.trim()) {
        input.steel_grade = steelGrade.trim();
      }
      if (thickness.trim()) {
        input.thickness = Number(thickness);
      }
      if (width.trim()) {
        input.width = Number(width);
      }
      if (length.trim()) {
        input.length = Number(length);
      }

      const response = await searchSupplierMatches(input);
      setDemandSummary(response.demand_summary);
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Matching search failed");
      setResults([]);
      setDemandSummary(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <MuiLink component={Link} to="/" underline="hover">
            Back to map dashboard
          </MuiLink>
          <Typography variant="h4" sx={{ mt: 1 }}>
            Supplier Matching
          </Typography>
          <Typography color="text.secondary">
            Find suppliers that can satisfy a customer demand using product
            specs, discrete dimension options, and port proximity.
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Customer (optional)"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              disabled={customersLoading}
              helperText="Used for geographic proximity and default demand from customer products"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.company_name}
                  {customer.country ? ` (${customer.country})` : ""}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Product category"
                value={productCategory}
                onChange={(event) => setProductCategory(event.target.value)}
                fullWidth
              />
              <TextField
                label="Steel grade"
                value={steelGrade}
                onChange={(event) => setSteelGrade(event.target.value)}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Thickness"
                type="number"
                value={thickness}
                onChange={(event) => setThickness(event.target.value)}
                fullWidth
              />
              <TextField
                label="Width"
                type="number"
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                fullWidth
              />
              <TextField
                label="Length"
                type="number"
                value={length}
                onChange={(event) => setLength(event.target.value)}
                fullWidth
              />
            </Stack>

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "Searching…" : "Find suppliers"}
            </Button>
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        {demandSummary && (
          <Alert severity="info">Demand: {demandSummary}</Alert>
        )}

        {results.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {results.length} match{results.length === 1 ? "" : "es"} found
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Port</TableCell>
                    <TableCell>Category / Grade</TableCell>
                    <TableCell>Matched dimensions</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={`${result.supplier_id}-${result.product_id}`}>
                      <TableCell>{result.supplier_name}</TableCell>
                      <TableCell>{result.country ?? "—"}</TableCell>
                      <TableCell>{result.port_name ?? "—"}</TableCell>
                      <TableCell>
                        {result.product_category}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {result.steel_grade}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDimensions(result)}</TableCell>
                      <TableCell align="right">
                        <Tooltip
                          title={<ScoreBreakdownTooltip result={result} />}
                          arrow
                        >
                          <Chip
                            label={`${Math.round(result.score * 100)}%`}
                            color={
                              result.score >= 0.75
                                ? "success"
                                : result.score >= 0.5
                                  ? "warning"
                                  : "default"
                            }
                            size="small"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{result.reason}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {!loading && demandSummary && results.length === 0 && !error && (
          <Alert severity="warning">
            No suppliers matched the demand criteria.
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
