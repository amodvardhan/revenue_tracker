import { useEffect, useState } from "react";
import type { MonthlyFinancialFact } from "../models/financial";
import { FinancialApiError, getFinancialFacts } from "../services/financialApi";

interface UseFinancialFactsResult {
  facts: MonthlyFinancialFact[];
  isLoading: boolean;
  error: FinancialApiError | null;
}

export function useFinancialFacts(): UseFinancialFactsResult {
  const [facts, setFacts] = useState<MonthlyFinancialFact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FinancialApiError | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFacts() {
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
  }, []);

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
