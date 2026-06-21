import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Link,
  Typography,
} from "@mui/material";
import type { Company } from "@stip/shared-types";

type CompanyMapDrawerProps = {
  open: boolean;
  company: Company | null;
  onClose: () => void;
};

function DetailRow(label: string, value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}

export function CompanyMapDrawer({ open, company, onClose }: CompanyMapDrawerProps) {
  const portName = company?.port?.port_name ?? company?.port_name;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 320, sm: 400 }, p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Company Details
          </Typography>
          <IconButton onClick={onClose} aria-label="Close company details">
            <CloseIcon />
          </IconButton>
        </Box>

        {company ? (
          <>
            <Typography variant="h5" gutterBottom>
              {company.company_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {company.company_type}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {DetailRow("Country", company.country)}
            {DetailRow("City", company.city)}
            {DetailRow("Port", portName)}
            {company.website ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Website
                </Typography>
                <Link href={company.website} target="_blank" rel="noopener noreferrer">
                  {company.website}
                </Link>
              </Box>
            ) : null}
            {DetailRow("Remarks", company.remarks)}
          </>
        ) : (
          <Typography color="text.secondary">Select a company on the map.</Typography>
        )}
      </Box>
    </Drawer>
  );
}
