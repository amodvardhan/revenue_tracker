import React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";

import { RevenueTrackerMark } from "../../app/branding/RevenueTrackerMark";
import { useSession } from "../../app/SessionContext";

const drawerWidth = 288;

const primaryNavItems = [
  { to: "/dashboard", label: "Dashboard", Icon: DashboardRoundedIcon },
  { to: "/projects", label: "Projects", Icon: FolderRoundedIcon },
  { to: "/attendance", label: "Attendance", Icon: EventAvailableRoundedIcon },
  { to: "/revenue", label: "Revenue", Icon: TrendingUpRoundedIcon }
];

export function MainLayout(): JSX.Element {
  const { session, logout } = useSession();
  const location = useLocation();

  const navItems =
    session?.role === "admin" ||
    session?.role === "delivery_manager" ||
    session?.role === "account_manager"
      ? [
          ...primaryNavItems,
          { to: "/configuration", label: "Configuration", Icon: TuneRoundedIcon }
        ]
      : primaryNavItems;

  function formatRoleLabel(role: string): string {
    return role
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  const displayName = session?.name?.trim() || "Signed in";
  const roleLabel = session?.role ? formatRoleLabel(session.role) : "";
  const avatarLetter = (displayName === "Signed in" ? roleLabel || "?" : displayName).charAt(0).toUpperCase();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: alpha("#ffffff", 0.78),
          backdropFilter: "saturate(180%) blur(22px)",
          WebkitBackdropFilter: "saturate(180%) blur(22px)",
          borderBottom: "none",
          color: "text.primary",
          boxShadow: "none"
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, sm: 54 },
            px: { xs: 2, sm: 3 },
            justifyContent: "flex-end",
            gap: 1
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mr: 0.5,
              minWidth: 0
            }}
          >
            <Avatar
              sx={(theme) => ({
                width: 34,
                height: 34,
                fontSize: "0.8125rem",
                fontWeight: 600,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`
              })}
            >
              {avatarLetter}
            </Avatar>
            <Tooltip title={roleLabel ? `${displayName} · ${roleLabel}` : displayName} enterDelay={400} placement="bottom">
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{
                    maxWidth: { xs: 140, sm: 220 },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "default",
                    fontWeight: 600,
                    lineHeight: 1.2
                  }}
                >
                  {displayName}
                </Typography>
                {roleLabel ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      maxWidth: { xs: 140, sm: 220 },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                      letterSpacing: "0.01em"
                    }}
                  >
                    {roleLabel}
                  </Typography>
                ) : null}
              </Box>
            </Tooltip>
          </Box>
          <Button color="inherit" variant="text" onClick={() => void logout()} sx={{ fontWeight: 600 }}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.94),
            pt: 0,
            backgroundImage: (theme) =>
              `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 28%)`
          }
        }}
      >
        <Toolbar />
        <Box sx={{ px: 2.5, pt: 1.5, pb: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              sx={(theme) => ({
                width: 40,
                height: 40,
                borderRadius: "11px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.background.paper, 0.65),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                boxShadow: `0 6px 18px ${alpha(theme.palette.common.black, 0.07)}`
              })}
            >
              <RevenueTrackerMark size={30} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.25
                }}
              >
                Revenue Tracker
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: "-0.01em" }}>
                Portfolio clarity
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box component="nav" aria-label="Main navigation" sx={{ px: 1.5, pb: 2, pt: 2 }}>
          <Typography variant="overline" sx={{ px: 2, py: 0.5, display: "block" }}>
            Navigate
          </Typography>
          <List dense disablePadding sx={{ mt: 1 }}>
            {navItems.map(({ to, label, Icon }) => {
              const selected = location.pathname === to;
              return (
                <ListItemButton
                  key={to}
                  component={RouterLink}
                  to={to}
                  selected={selected}
                  sx={(theme) => ({
                    mb: 0.35,
                    mx: 0.5,
                    borderRadius: 2,
                    py: 1.35,
                    pl: 2,
                    position: "relative",
                    overflow: "hidden",
                    "&.Mui-selected": {
                      bgcolor: alpha(theme.palette.primary.main, 0.09),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.12)
                      }
                    },
                    ...(selected
                      ? {
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 3,
                            height: 22,
                            borderRadius: 1,
                            bgcolor: "primary.main"
                          }
                        }
                      : {})
                  })}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 42,
                      pl: selected ? 0.75 : 0,
                      color: selected ? "primary.main" : "text.secondary",
                      transition: "color 0.15s ease"
                    }}
                  >
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: selected ? 600 : 500,
                          fontSize: "0.9375rem",
                          letterSpacing: "-0.015em"
                        }
                      }
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
        <Divider />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 6.75 },
          px: { xs: 2, sm: 3, md: 5 },
          pb: { xs: 5, md: 8 },
          maxWidth: 1240,
          mx: "auto"
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
