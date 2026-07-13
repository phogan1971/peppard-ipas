import { Component, ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import { regenerateData } from "../data/store";

interface Props {
  children: ReactNode;
  // When this value changes the boundary clears a caught error, so navigating
  // away from a broken page recovers instead of staying stuck on the card.
  resetKey?: string | number;
  // Optional compact fallback (e.g. inside a dialog) instead of the full card.
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

// Live-demo insurance: a render error shows a recoverable card instead
// of a blank page in front of the Department.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <Paper sx={{ p: 3, maxWidth: 480 }}>
          <Typography variant="h6" sx={{ color: "text.primary", mb: 1 }}>
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
