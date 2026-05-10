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
  Toolbar,
  Typography
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";

import { useSession } from "../../app/SessionContext";

const drawerWidth = 268;

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
    session?.role === "delivery_manager" || session?.role === "account_manager"
      ? [
          ...primaryNavItems,
          { to: "/configuration", label: "Configuration", Icon: TuneRoundedIcon }
        ]
      : primaryNavItems;

  const roleLabel = session?.role.replace(/_/g, " ") ?? "";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: alpha("#ffffff", 0.72),
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary"
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 52 }, px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              fontSize: "1.0625rem"
            }}
          >
            Revenue Tracker
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mr: 1,
              minWidth: 0
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: "0.8125rem",
                fontWeight: 600,
                bgcolor: alpha("#0071e3", 0.12),
                color: "primary.main"
              }}
            >
              {session?.role?.charAt(0).toUpperCase() ?? "?"}
            </Avatar>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: { xs: "none", sm: "block" },
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {roleLabel}
            </Typography>
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
            bgcolor: alpha("#fafafa", 0.98),
            pt: 1
          }
        }}
      >
        <Toolbar />
        <Box sx={{ px: 1.5, pb: 2, pt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              display: "block",
              color: "text.secondary",
              letterSpacing: "0.06em",
              fontWeight: 600,
              fontSize: "0.6875rem",
              textTransform: "uppercase"
            }}
          >
            Overview
          </Typography>
          <List dense disablePadding sx={{ mt: 0.5 }}>
            {navItems.map(({ to, label, Icon }) => {
              const selected = location.pathname === to;
              return (
                <ListItemButton
                  key={to}
                  component={RouterLink}
                  to={to}
                  selected={selected}
                  sx={{
                    mb: 0.25,
                    mx: 0.5,
                    borderRadius: 2,
                    py: 1.25,
                    "&.Mui-selected": {
                      bgcolor: alpha("#0071e3", 0.1),
                      "&:hover": {
                        bgcolor: alpha("#0071e3", 0.14)
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: selected ? "primary.main" : "text.secondary" }}>
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
          mt: { xs: 7, sm: 6.5 },
          px: { xs: 2, sm: 3, md: 4 },
          pb: 6,
          maxWidth: 1200,
          mx: "auto"
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
