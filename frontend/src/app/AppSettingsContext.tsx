import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { getAppSettings } from "../features/app/services/appApi";
import { useSession } from "./SessionContext";
import {
  formatCurrencyAmount,
  formatCurrencyCompact,
  formatCurrencySigned
} from "../lib/formatMoney";

interface AppSettingsContextValue {
  defaultCurrencyCode: string;
  loaded: boolean;
  refresh: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const { session } = useSession();
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState("EUR");
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const data = await getAppSettings();
    setDefaultCurrencyCode(data.defaultCurrencyCode);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!session) {
      setDefaultCurrencyCode("EUR");
      setLoaded(false);
      return;
    }

    let cancelled = false;
    void getAppSettings()
      .then((data) => {
        if (!cancelled) {
          setDefaultCurrencyCode(data.defaultCurrencyCode);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const value = useMemo(
    () => ({
      defaultCurrencyCode,
      loaded,
      refresh
    }),
    [defaultCurrencyCode, loaded, refresh]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return ctx;
}

/** Money formatters using the organization default currency from Configuration. */
export function useFormatMoney() {
  const { defaultCurrencyCode } = useAppSettings();

  return useMemo(
    () => ({
      currencyCode: defaultCurrencyCode,
      formatAmount: (value: number) => formatCurrencyAmount(value, defaultCurrencyCode),
      /** Rates and inputs that omit trailing decimals when whole. */
      formatAmountFlexible: (value: number) =>
        formatCurrencyAmount(value, defaultCurrencyCode, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }),
      formatCompact: (value: number) => formatCurrencyCompact(value, defaultCurrencyCode),
      formatSigned: (value: number) => formatCurrencySigned(value, defaultCurrencyCode)
    }),
    [defaultCurrencyCode]
  );
}
