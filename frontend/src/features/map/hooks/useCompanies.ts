import { useEffect, useState } from "react";
import type { Company } from "@stip/shared-types";
import { fetchAllCompanies, type CompanyListFilters } from "@/shared/lib";

export function useCompanies(filters: CompanyListFilters) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchAllCompanies(filters);
        if (!cancelled) {
          setCompanies(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load companies");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [filters.country, filters.search]);

  return { companies, loading, error };
}
