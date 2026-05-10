import React from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AttendancePage } from "../features/attendance/pages/AttendancePage";
import { MainLayout } from "../features/app/MainLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { ProjectsPage } from "../features/projects/pages/ProjectsPage";
import { ConfigurationPage } from "../features/configuration/pages/ConfigurationPage";
import { RevenuePage } from "../features/revenue/pages/RevenuePage";
import { AppSettingsProvider } from "./AppSettingsContext";
import { appTheme } from "./theme";
import { RequireAuth } from "./RequireAuth";
import { SessionProvider } from "./SessionContext";

export function App(): JSX.Element {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <BrowserRouter>
        <SessionProvider>
          <AppSettingsProvider>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/revenue" element={<RevenuePage />} />
                <Route path="/configuration" element={<ConfigurationPage />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AppSettingsProvider>
        </SessionProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
