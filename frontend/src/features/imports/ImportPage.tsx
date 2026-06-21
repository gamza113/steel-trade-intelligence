import { useState } from "react";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Alert,
  Box,
  Button,
  Container,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import type { ImportSummary } from "@stip/shared-types";
import { importExcelMaster } from "@/shared/lib";

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    setSummary(null);
  };

  const handleImport = async () => {
    if (!file) {
      setError("Select an Excel master file to import.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await importExcelMaster(file);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <MuiLink component={Link} to="/" underline="hover">
            Back to map dashboard
          </MuiLink>
          <Typography variant="h4" sx={{ mt: 1 }}>
            Excel Master Import
          </Typography>
          <Typography color="text.secondary">
            Upload the master workbook with <code>tblSuppliers</code> and{" "}
            <code>tblCustomers</code> sheets.
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
            >
              Choose Excel file
              <input
                hidden
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
              />
            </Button>

            {file ? (
              <Typography variant="body2" color="text.secondary">
                Selected: {file.name}
              </Typography>
            ) : null}

            <Button
              variant="contained"
              onClick={handleImport}
              disabled={!file || loading}
            >
              {loading ? "Importing…" : "Import master file"}
            </Button>

            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </Paper>

        {summary ? (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Import summary
            </Typography>
            <Stack spacing={1}>
              <Typography>Supplier rows imported: {summary.supplier_rows_imported}</Typography>
              <Typography>Customer rows imported: {summary.customer_rows_imported}</Typography>
              <Typography>Product rows imported: {summary.product_rows_imported}</Typography>
              <Typography>
                Failed rows: {summary.failed_rows.length}
              </Typography>
              <Typography>
                Warnings: {summary.warnings.length}
              </Typography>
            </Stack>

            {summary.failed_rows.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Failed rows
                </Typography>
                <Stack spacing={0.5}>
                  {summary.failed_rows.map((row) => (
                    <Typography key={`${row.sheet}-${row.row}`} variant="body2" color="error">
                      {row.sheet} row {row.row}: {row.reason}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ) : null}

            {summary.warnings.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Warnings
                </Typography>
                <Stack spacing={0.5}>
                  {summary.warnings.map((warning, index) => (
                    <Typography key={`${warning}-${index}`} variant="body2" color="warning.main">
                      {warning}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ) : null}
          </Paper>
        ) : null}
      </Stack>
    </Container>
  );
}
