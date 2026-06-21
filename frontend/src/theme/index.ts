import { createTheme } from "@mui/material/styles";

export const stipTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1a365d",
    },
    secondary: {
      main: "#c53030",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});
