import { Component, ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { brand } from "../theme/tokens";
import { regenerateData } from "../data/store";

interface State {
  error: Error | null;
}

// Live-demo insurance: a render error shows a recoverable card instead
// of a blank page in front of the Department.
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <Paper sx={{ p: 3, maxWidth: 480 }}>
          <Typography variant="h6" sx={{ color: brand.charcoal, mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 2 }}>
            {this.state.error.message}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" disableElevation onClick={() => window.location.assign("/overview")}>
              Reload dashboard
            </Button>
            <Button
              onClick={() => {
                regenerateData();
                window.location.assign("/overview");
              }}
            >
              Regenerate data
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
}
