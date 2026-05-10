import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { RevenueTrackerMark } from "./branding/RevenueTrackerMark";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Short label above the title (matches dashboard “Portfolio overview” pattern). */
  eyebrow?: string;
}

export function PageHeader({ title, description, eyebrow = "Workspace" }: PageHeaderProps): JSX.Element {
  return (
    <Box
      component="header"
      sx={{
        position: "relative",
        mb: { xs: 3, sm: 4 },
        p: { xs: 2.5, sm: 3.75 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        width: "100%",
        maxWidth: "none",
        boxSizing: "border-box",
        background: (theme) =>
          `linear-gradient(125deg, ${alpha(theme.palette.primary.main, 0.09)} 0%, ${alpha(
            theme.palette.background.paper,
            0.97
          )} 38%, ${theme.palette.background.paper} 68%)`,
        boxShadow: (theme) =>
          `0 0 0 1px ${alpha(theme.palette.primary.main, 0.05)}, 0 18px 48px ${alpha(theme.palette.common.black, 0.05)}`
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: { xs: -48, sm: -56 },
          right: { xs: -32, sm: -24 },
          width: { xs: 200, sm: 260 },
          height: { xs: 200, sm: 260 },
          borderRadius: "50%",
          background: (theme) => alpha(theme.palette.primary.main, 0.12),
          filter: "blur(48px)"
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          bottom: -24,
          left: "18%",
          width: 140,
          height: 100,
          borderRadius: "50%",
          background: (theme) => alpha(theme.palette.primary.main, 0.06),
          filter: "blur(32px)"
        }}
      />

      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2.25, sm: 3 },
          alignItems: { xs: "flex-start", sm: "center" }
        }}
      >
        <Box
          sx={(theme) => ({
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: { xs: 64, sm: 72 },
            height: { xs: 64, sm: 72 },
            borderRadius: "18px",
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            boxShadow: `0 12px 36px ${alpha(theme.palette.common.black, 0.08)}, inset 0 1px 0 ${alpha("#ffffff", 0.75)}`
          })}
        >
          <RevenueTrackerMark size={46} />
        </Box>

        <Box sx={{ minWidth: 0, pt: { xs: 0, sm: 0.25 } }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mb: 0.75,
              color: "primary.main",
              letterSpacing: "0.11em",
              fontWeight: 600,
              fontSize: "0.6875rem"
            }}
          >
            {eyebrow}
          </Typography>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 600,
              letterSpacing: "-0.035em",
              lineHeight: 1.08,
              mb: description ? 1.25 : 0,
              fontSize: { xs: "1.75rem", sm: "2rem", md: "2.125rem" }
            }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontWeight: 500,
                letterSpacing: "-0.014em",
                lineHeight: 1.55,
                maxWidth: 640,
                fontSize: "1.0625rem"
              }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
