import { alpha, createTheme } from "@mui/material/styles";

/**
 * Visual language: calm neutrals, crisp ink, one confident accent — content leads.
 * Surfaces are mostly flat with hairline separation; motion stays short and purposeful.
 */
const canvas = "#f5f5f4";
const elevated = "#ffffff";
const ink = "#1d1d1f";
const inkSecondary = "#6e6e73";
const hairline = alpha("#000000", 0.06);

/** Shared radius for cards, charts, and data surfaces (theme-driven, not ad hoc). */
export const surfaceRadiusPx = 14;

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0071e3",
      dark: "#0058c5",
      light: alpha("#0071e3", 0.12)
    },
    secondary: {
      main: ink,
      contrastText: "#ffffff"
    },
    background: {
      default: canvas,
      paper: elevated
    },
    text: {
      primary: ink,
      secondary: inkSecondary
    },
    divider: hairline,
    action: {
      hover: alpha("#000000", 0.04),
      selected: alpha("#0071e3", 0.08)
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
    h3: {
      fontWeight: 600,
      letterSpacing: "-0.024em",
      lineHeight: 1.12
    },
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.022em",
      lineHeight: 1.15
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.019em",
      lineHeight: 1.2
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "-0.017em",
      lineHeight: 1.22
    },
    subtitle1: {
      fontWeight: 600,
      letterSpacing: "-0.013em"
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: "-0.011em"
    },
    body1: {
      letterSpacing: "-0.011em",
      fontSize: "1.0625rem",
      lineHeight: 1.5
    },
    body2: {
      letterSpacing: "-0.008em",
      lineHeight: 1.48
    },
    caption: {
      letterSpacing: "-0.004em",
      fontSize: "0.75rem",
      lineHeight: 1.33,
      fontWeight: 500
    },
    overline: {
      letterSpacing: "0.06em",
      fontWeight: 600,
      fontSize: "0.6875rem",
      textTransform: "uppercase",
      color: inkSecondary,
      lineHeight: 1.2
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
        html: {
          colorScheme: "light"
        },
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility"
        },
        "::selection": {
          backgroundColor: alpha("#0071e3", 0.16)
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
          px: 2.5,
          py: 1,
          minHeight: 44,
          transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
          boxShadow: "none",
          "&.MuiButton-containedPrimary": {
            boxShadow: "none"
          },
          "&.MuiButton-containedPrimary:hover": {
            boxShadow: "none"
          }
        },
        outlined: {
          borderColor: alpha("#000000", 0.1),
          "&:hover": {
            borderColor: alpha("#000000", 0.18),
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
          borderRadius: surfaceRadiusPx,
          border: `1px solid ${hairline}`,
          boxShadow: "none"
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
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#000000", 0.1)
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#000000", 0.16)
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 1,
            borderColor: alpha("#0071e3", 0.55)
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
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: inkSecondary,
          backgroundColor: elevated,
          borderBottom: `1px solid ${alpha("#000000", 0.08)}`
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: "background-color 0.15s ease, color 0.15s ease",
          "&:focus-visible": {
            outline: `2px solid ${alpha(theme.palette.primary.main, 0.45)}`,
            outlineOffset: 2
          }
        })
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          letterSpacing: "-0.01em"
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.75rem",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          borderRadius: 10,
          px: 1.25,
          py: 0.75
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${hairline}`,
          borderRadius: `${surfaceRadiusPx}px !important`,
          boxShadow: "none",
          "&:before": {
            display: "none"
          },
          "&.Mui-expanded": {
            margin: 0
          }
        }
      }
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 52,
          px: 2,
          "& .MuiAccordionSummary-content": {
            margin: "12px 0"
          }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44
        },
        indicator: {
          height: 2,
          borderRadius: 2
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "-0.012em",
          fontSize: "0.9375rem"
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: surfaceRadiusPx + 4,
          border: `1px solid ${hairline}`,
          boxShadow: `0 24px 80px ${alpha("#000000", 0.12)}`
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: hairline
        }
      }
    }
  }
});
