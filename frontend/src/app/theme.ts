import { alpha, createTheme } from "@mui/material/styles";

/** Neutral, content-forward palette inspired by clarity-first human interface guidelines. */
const neutralBg = "#f5f5f7";
const surface = "#ffffff";
const ink = "#1d1d1f";
const inkSecondary = "#6e6e73";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0071e3",
      dark: "#0077ed",
      light: alpha("#0071e3", 0.12)
    },
    secondary: {
      main: ink,
      contrastText: "#ffffff"
    },
    background: {
      default: neutralBg,
      paper: surface
    },
    text: {
      primary: ink,
      secondary: inkSecondary
    },
    divider: alpha("#000000", 0.08)
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.022em",
      lineHeight: 1.15
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.019em"
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.017em"
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: "-0.011em"
    },
    body1: {
      letterSpacing: "-0.011em"
    },
    body2: {
      letterSpacing: "-0.008em",
      lineHeight: 1.47
    },
    caption: {
      letterSpacing: "-0.004em"
    },
    button: {
      fontWeight: 600,
      letterSpacing: "-0.011em",
      textTransform: "none"
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale"
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        variant: "contained"
      },
      styleOverrides: {
        root: {
          borderRadius: 980,
          px: 2.25,
          py: 1,
          minHeight: 44,
          boxShadow: "none",
          "&.MuiButton-containedPrimary": {
            boxShadow: "none"
          },
          "&.MuiButton-containedPrimary:hover": {
            boxShadow: "none"
          }
        },
        outlined: {
          borderColor: alpha("#000000", 0.12),
          "&:hover": {
            borderColor: alpha("#000000", 0.2),
            backgroundColor: alpha("#000000", 0.03)
          }
        },
        text: {
          "&:hover": {
            backgroundColor: alpha("#000000", 0.04)
          }
        }
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 16,
          border: `1px solid ${alpha("#000000", 0.06)}`
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined"
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#000000", 0.12)
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#000000", 0.2)
          }
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          alignItems: "center"
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: "0.75rem",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: inkSecondary,
          borderBottom: `1px solid ${alpha("#000000", 0.08)}`
        }
      }
    }
  }
});
