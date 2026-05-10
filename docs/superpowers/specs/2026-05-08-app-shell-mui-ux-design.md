# Revenue Tracker — App Shell & UX Design (MUI)

**Stack decision:** Material UI (`@mui/material` + `@emotion/react` + `@emotion/styled`) per DOCX “modern UI” alignment.

**Goal:** Replace ad-hoc inline UI with a professional shell: dedicated auth, role-aware navigation, entity pickers (no raw IDs as primary input), logout, and bulk template download/upload flows.

---

## 1. Information architecture

- **Unauthenticated routes**
  - `/login` — email/password, inline validation, link to password hint (policy text).
- **Authenticated shell** (persistent `AppBar` + `Drawer` + `Outlet` / main content)
  - `/dashboard` — revenue grid + filters + summary (existing data, MUI `DataGrid` or table).
  - `/projects` — list + “Create project” (dialog or dedicated sub-route).
  - `/projects/:projectId` — detail: assignments, attendance, bulk actions for that project.
  - `/assignments` (optional) — cross-project list or deep-linked from project only; **primary flow is project-scoped** to avoid orphan IDs.
  - `/settings` (optional later) — theme density only.

**Navigation:** Left drawer on desktop; temporary drawer on small screens. Items gated by RBAC (mirror backend roles).

---

## 2. Auth UX

- **Login** only on `/login`. No login panel on dashboard or forms.
- After login: store `token` + `role` + `userId` in `sessionStorage` or memory + optional refresh later; attach `Authorization: Bearer <token>` on all API calls via a single `apiClient`.
- **Logout:** AppBar right section — user menu (`AccountCircle`) with “Logout” calling `POST /api/auth/logout` and clearing storage, then redirect to `/login`.
- **Session expiry:** On `401`, clear session and redirect to login with a snackbar message.

---

## 3. Forms: no raw IDs as primary input

- **Project-scoped flows:** User selects **Account** (filter) → **Project** from `GET /api/projects` (dropdown with `projectName`, value `id`).
- **Assignment:** Dropdown populated from `GET /api/projects/:projectId/assignments` showing `teamMemberName` + `employeeId` as secondary label; value is `assignmentId`.
- **Advanced:** Collapsible “Paste assignment ID” for power users only.

---

## 4. Bulk template export / import

- **Assignments bulk:** Button “Download template” → static XLSX or CSV generated client-side (SheetJS `xlsx` or CSV) with header row matching backend bulk body; “Upload” parses file and posts to `POST /api/projects/:projectId/assignments/bulk-upload` with validation errors shown in `Alert` + row-level table.
- **Attendance bulk:** Same pattern for `POST /api/projects/:projectId/attendance/bulk-upload`.
- **Projections bulk:** Template + `POST /api/projections/bulk-upload`.

If backend expects JSON array only today, frontend builds JSON from parsed sheet; optional follow-up: multipart XLSX on backend.

---

## 5. MUI theming

- `ThemeProvider` with `createTheme`: primary `#0f766e` (or brand color), `CssBaseline`, responsive typography.
- Use `TextField`, `Select`, `Button`, `DataGrid` (if `@mui/x-data-grid` added), `Snackbar`/`Alert` for feedback, `Dialog` for create flows.

---

## 6. Error handling & validation

- Client: required fields, date order, `YYYY-MM` regex, numeric ranges (allocation 0–100, rates > 0, actual ≤ expected where derivable).
- Server messages: show `message` from Nest exceptions in `Snackbar`.

---

## 7. Testing

- Vitest + React Testing Library: Login page renders; authenticated shell shows drawer; mock fetch for projects list.

---

## 8. Implementation order (high level)

1. Add MUI deps + theme + `CssBaseline`.
2. Add `react-router-dom`; routes login vs shell.
3. Extract API module with bearer header from session.
4. Refactor `AppShell` into MUI layout + remove duplicate login from content pages.
5. Replace ID text inputs with `Select` fed by API.
6. Add logout + user menu.
7. Add bulk template download + file upload + validation table.

---

**Open points resolved in this spec**

- Login not repeated on every screen: **yes**, single `/login`.
- IDs as inputs: **replaced by dropdowns**; advanced paste optional.
- Logout: **AppBar user menu**.
- Export/import templates: **defined** (client-generated template + upload).
- MUI: **chosen** (option B).

Please review this spec. Reply **“approve spec”** to proceed to the implementation plan (`writing-plans`), then code.
