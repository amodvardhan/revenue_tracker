import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";

import { useAppSettings } from "../../../app/AppSettingsContext";
import { PageHeader } from "../../../app/PageHeader";
import { usePageFeedback } from "../../../app/usePageFeedback";
import { useSession } from "../../../app/SessionContext";
import { OrganizationSettingsPanel } from "../components/OrganizationSettingsPanel";
import { getAppSettings, updateAppSettings } from "../../app/services/appApi";

function normalizeCurrencyInput(raw: string): string {
  return raw.trim().toUpperCase().slice(0, 3);
}

type ConfigurationTab = "defaults" | "organization";

export function ConfigurationPage(): JSX.Element {
  const { refresh: refreshAppSettings } = useAppSettings();
  const { session } = useSession();
  const { notifySuccess, notifyError, FeedbackSnackbar } = usePageFeedback();
  const [searchParams] = useSearchParams();

  const canEdit =
    session?.role === "delivery_manager" || session?.role === "account_manager";

  const [configTab, setConfigTab] = useState<ConfigurationTab>("defaults");
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState("EUR");
  const [defaultRevenueDays, setDefaultRevenueDays] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (searchParams.get("section") === "organization") {
      setConfigTab("organization");
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getAppSettings();
        if (!cancelled) {
          setDefaultCurrencyCode(data.defaultCurrencyCode);
          setDefaultRevenueDays(data.defaultRevenueDays);
        }
      } catch (err) {
        notifyError(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notifyError]);

  async function handleSave(): Promise<void> {
    const code = normalizeCurrencyInput(defaultCurrencyCode);
    if (!/^[A-Z]{3}$/.test(code)) {
      notifyError(new Error("Currency must be a 3-letter ISO code (for example EUR)."));
      return;
    }
    const days = Math.round(Number(defaultRevenueDays));
    if (!Number.isFinite(days) || days < 1 || days > 31) {
      notifyError(new Error("Default revenue days must be between 1 and 31."));
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAppSettings({
        defaultCurrencyCode: code,
        defaultRevenueDays: days
      });
      setDefaultCurrencyCode(updated.defaultCurrencyCode);
      setDefaultRevenueDays(updated.defaultRevenueDays);
      await refreshAppSettings();
      notifySuccess("Configuration saved.");
    } catch (err) {
      notifyError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box component="section">
      <PageHeader
        eyebrow="Organization"
        title="Configuration"
        description={
          canEdit
            ? "Reporting defaults, business units, and accounts (with delivery and account managers)."
            : "View organization settings. Editing is limited to delivery and account managers."
        }
      />

      <Paper elevation={0} sx={{ mb: 2 }}>
        <Tabs
          value={configTab}
          onChange={(_, v: ConfigurationTab) => setConfigTab(v)}
          variant="fullWidth"
          sx={{ minHeight: 48, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
        >
          <Tab value="defaults" label="Reporting defaults" />
          <Tab value="organization" label="Organization" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={36} />
        </Box>
      ) : configTab === "defaults" ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            maxWidth: 520,
            border: "1px solid",
            borderColor: "divider"
          }}
        >
          <Stack spacing={2.5}>
            <TextField
              label="Default currency"
              value={defaultCurrencyCode}
              onChange={(e) => setDefaultCurrencyCode(normalizeCurrencyInput(e.target.value))}
              disabled={!canEdit || saving}
              helperText="ISO 4217 alphabetic code (3 letters), for example EUR."
              slotProps={{ htmlInput: { maxLength: 3, style: { letterSpacing: "0.08em" } } }}
              fullWidth
            />
            <TextField
              label="Default revenue days per month"
              type="number"
              value={defaultRevenueDays}
              onChange={(e) => setDefaultRevenueDays(Number(e.target.value))}
              disabled={!canEdit || saving}
              helperText="Baseline expected working days in a month (1–31). Used for allocations and monthly facts."
              slotProps={{ htmlInput: { min: 1, max: 31, step: 1 } }}
              fullWidth
            />
            {canEdit ? (
              <Box>
                <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Only delivery managers and account managers can change these values.
              </Typography>
            )}
          </Stack>
        </Paper>
      ) : (
        <OrganizationSettingsPanel canEdit={canEdit} notifySuccess={notifySuccess} notifyError={notifyError} />
      )}
      {FeedbackSnackbar}
    </Box>
  );
}
