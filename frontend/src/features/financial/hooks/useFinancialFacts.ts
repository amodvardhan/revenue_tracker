import { useEffect, useState } from "react";
import type { MonthlyFinancialFact } from "../models/financial";
import { getFinancialFacts } from "../services/financialApi";

interface UseFinancialFactsResult {
  facts: MonthlyFinancialFact[];
  isLoading: boolean;
  error: string | null;
}

export function useFinancialFacts(): UseFinancialFactsResult {
  const [facts, setFacts] = useState<MonthlyFinancialFact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch {
        if (!isMounted) {
          return;
        }

        setError("Unable to load monthly financial facts.");
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
