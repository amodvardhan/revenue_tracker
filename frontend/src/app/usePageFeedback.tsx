import React, { useCallback, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

import { friendlyError } from "../lib/friendlyError";

interface ToastPayload {
  message: string;
  severity: "success" | "error";
}

export function usePageFeedback(): {
  notifySuccess: (message: string) => void;
  notifyError: (input: unknown) => void;
  notifyRawError: (message: string) => void;
  FeedbackSnackbar: JSX.Element;
} {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const notifySuccess = useCallback((message: string) => {
    setToast({ message, severity: "success" });
  }, []);

  const notifyError = useCallback((input: unknown) => {
    setToast({ message: friendlyError(input), severity: "error" });
  }, []);

  const notifyRawError = useCallback((message: string) => {
    setToast({ message, severity: "error" });
  }, []);

  const handleClose = useCallback((_event?: unknown, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setToast(null);
  }, []);

  const FeedbackSnackbar = (
    <Snackbar
      open={toast !== null}
      autoHideDuration={toast?.severity === "success" ? 4800 : null}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ bottom: { xs: 16, sm: 24 } }}
    >
      {toast ? (
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant={toast.severity === "error" ? "filled" : "standard"}
          sx={{
            width: "100%",
            maxWidth: 520,
            alignItems: "center",
            boxShadow: (theme) => theme.shadows[8]
          }}
        >
          {toast.message}
        </Alert>
      ) : (
        <span />
      )}
    </Snackbar>
  );

  return { notifySuccess, notifyError, notifyRawError, FeedbackSnackbar };
}
