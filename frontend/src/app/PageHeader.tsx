import React from "react";
import { Box, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps): JSX.Element {
  return (
    <Box sx={{ mb: 4, maxWidth: 880 }}>
      <Typography
        component="h1"
        variant="h4"
        sx={{
          fontWeight: 600,
          letterSpacing: "-0.03em",
          mb: description ? 1 : 0
        }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: "1.0625rem" }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}
