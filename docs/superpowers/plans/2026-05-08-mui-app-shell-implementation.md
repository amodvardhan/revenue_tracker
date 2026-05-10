# MUI App Shell Implementation Plan

> **For agentic workers:** Inline execution after spec approval `2026-05-08-app-shell-mui-ux-design.md`.

**Goal:** MUI-based shell with `/login`, protected routes, AppBar logout, entity pickers, bulk template download/upload.

**Tasks:** (executing in this session)

1. Add deps: `@mui/material`, `@emotion/react`, `@emotion/styled`, `react-router-dom`, `xlsx`
2. Add `SessionContext`, `sessionStorage` keys, `apiClient` with bearer + 401 redirect
3. Add `theme`, `CssBaseline`, `BrowserRouter`, routes, `ProtectedRoute`
4. Build `LoginPage`, `MainLayout` (Drawer + AppBar + user menu)
5. Pages: Dashboard, Projects, Attendance, Revenue — MUI forms + pickers
6. Extend `appApi`: `logout`, `listAssignments`, bulk helpers; template XLSX via `xlsx`
7. Update `main.tsx`, remove monolithic login strip from old shell
8. Run `npm test` in frontend
