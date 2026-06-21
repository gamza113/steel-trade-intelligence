import { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Chip,
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
  Tooltip,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import type { Company, CompetitorAnalysisResult } from "@stip/shared-types";
import { analyzeCompetitors, fetchAllCompanies } from "@/shared/lib";

function formatDimensionOverlap(result: CompetitorAnalysisResult): string {
  return result.dimension_overlap
    .map((detail) => {
      if (detail.overlapping_values.length > 0) {
        return `${detail.dimension_type}: ${detail.overlapping_values.join(", ")}`;
      }
      if (detail.overlap_score === 1 && detail.reference_values.length === 0) {
        return `${detail.dimension_type}: flexible`;
      }
      return `${detail.dimension_type}: ${Math.round(detail.overlap_score * 100)}%`;
    })
    .join(" · ");
}

function ScoreBreakdownTooltip({ result }: { result: CompetitorAnalysisResult }) {
  const breakdown = result.score_breakdown;
  return (
    <Stack spacing={0.5} sx={{ p: 0.5 }}>
      <Typography variant="caption">
        Category: {Math.round(breakdown.product_category * 100)}% (30%)
      </Typography>
      <Typography variant="caption">
        Steel grade: {Math.round(breakdown.steel_grade * 100)}% (25%)
      </Typography>
      <Typography variant="caption">
        Dimension overlap: {Math.round(breakdown.dimension_overlap * 100)}% (30%)
      </Typography>
      <Typography variant="caption">
        Geographic: {Math.round(breakdown.geographic * 100)}% (10%)
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

export function CompetitorsPage() {
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierId, setSupplierId] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [steelGrade, setSteelGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [results, setResults] = useState<CompetitorAnalysisResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadSuppliers() {
      try {
        const companies = await fetchAllCompanies();
        if (!cancelled) {
          setSuppliers(
            companies.filter((company) => company.company_type === "Supplier"),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load suppliers",
          );
        }
      } finally {
        if (!cancelled) {
          setSuppliersLoading(false);
        }
      }
    }

    loadSuppliers();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAnalyze = async () => {
    if (!supplierId) {
      setError("Select a supplier to analyze.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: Record<string, string> = { supplier_id: supplierId };

      if (productCategory.trim()) {
        input.product_category = productCategory.trim();
      }
      if (steelGrade.trim()) {
        input.steel_grade = steelGrade.trim();
      }

      const response = await analyzeCompetitors(input);
      setAnalysisSummary(response.analysis_summary);
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Competitor analysis failed");
      setResults([]);
      setAnalysisSummary(null);
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
            Competitor Analysis
          </Typography>
          <Typography color="text.secondary">
            Find other suppliers with similar product capabilities, dimension
            overlap, and geographic proximity.
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField
              select
              required
              label="Supplier"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              disabled={suppliersLoading}
              helperText="Reference supplier whose competitors will be identified"
            >
              <MenuItem value="">
                <em>Select supplier</em>
              </MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.company_name}
                  {supplier.country ? ` (${supplier.country})` : ""}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Product category filter (optional)"
                value={productCategory}
                onChange={(event) => setProductCategory(event.target.value)}
                fullWidth
                helperText="Narrows reference products for comparison"
              />
              <TextField
                label="Steel grade filter (optional)"
                value={steelGrade}
                onChange={(event) => setSteelGrade(event.target.value)}
                fullWidth
                helperText="Narrows reference products for comparison"
              />
            </Stack>

            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleAnalyze}
              disabled={loading || !supplierId}
            >
              {loading ? "Analyzing…" : "Analyze competitors"}
            </Button>
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        {analysisSummary && (
          <Alert severity="info">{analysisSummary}</Alert>
        )}

        {results.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {results.length} competitor{results.length === 1 ? "" : "s"} found
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Competitor</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Port</TableCell>
                    <TableCell>Product similarity</TableCell>
                    <TableCell>Dimension overlap</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.competitor_id}>
                      <TableCell>{result.competitor_name}</TableCell>
                      <TableCell>{result.country ?? "—"}</TableCell>
                      <TableCell>{result.port_name ?? "—"}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {result.product_similarity}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ref: {result.reference_product_category} /{" "}
                          {result.reference_steel_grade}
                          <br />
                          Match: {result.competitor_product_category} /{" "}
                          {result.competitor_steel_grade}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDimensionOverlap(result)}</TableCell>
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

        {!loading && analysisSummary && results.length === 0 && !error && (
          <Alert severity="warning">
            No competitors with similar product capabilities were found.
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
