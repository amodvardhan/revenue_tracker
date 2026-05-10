import { useEffect, useState } from "react";

import { useSession } from "../../../app/SessionContext";
import type { MonthlyFinancialFact } from "../models/financial";
import { FinancialApiError, getFinancialFacts } from "../services/financialApi";

interface UseFinancialFactsResult {
  facts: MonthlyFinancialFact[];
  isLoading: boolean;
  error: FinancialApiError | null;
}

export function useFinancialFacts(): UseFinancialFactsResult {
  const { session } = useSession();
  const token = session?.token ?? null;

  const [facts, setFacts] = useState<MonthlyFinancialFact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FinancialApiError | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFacts() {
      if (!token) {
        if (!isMounted) return;
        setFacts([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const nextFacts = await getFinancialFacts();
        if (!isMounted) {
          return;
        }

        setFacts(nextFacts);
        setError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setError(toFinancialApiError(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFacts();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return { facts, isLoading, error };
}

function toFinancialApiError(error: unknown): FinancialApiError {
  if (error instanceof FinancialApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new FinancialApiError("network_error", `Unable to load monthly financial facts: ${error.message}`);
  }

  return new FinancialApiError("network_error", "Unable to load monthly financial facts.");
}
