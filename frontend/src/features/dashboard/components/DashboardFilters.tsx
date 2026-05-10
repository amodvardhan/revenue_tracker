import React from "react";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

interface DashboardFiltersProps {
  account: string;
  onAccountChange: (value: string) => void;
}

export function DashboardFilters({ account, onAccountChange }: DashboardFiltersProps): JSX.Element {
  const trimmed = account.trim();
  const active = trimmed.length > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { md: "flex-start" },
        gap: 2
      }}
    >
      <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <FilterListRoundedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" color="text.secondary">
            Narrow the table
          </Typography>
          {active ? (
            <Chip size="small" label="Filter on" color="primary" variant="outlined" sx={{ height: 24 }} />
          ) : null}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
          Matches any part of the compute key (case insensitive)—client code, employee id, month, etc.
        </Typography>
        <TextField
          id="accountFilter"
          value={account}
          onChange={(event) => onAccountChange(event.target.value)}
          placeholder="Try part of an account or key…"
          fullWidth
          size="small"
          margin="none"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: active ? (
                <InputAdornment position="end">
                  <Tooltip title="Clear filter">
                    <IconButton size="small" aria-label="Clear filter" onClick={() => onAccountChange("")}>
                      <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ) : null
            }
          }}
        />
      </Box>
    </Paper>
  );
}
