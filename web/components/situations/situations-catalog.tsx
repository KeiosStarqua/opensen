"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  createDefaultApiClient,
  formatApiErrorMessage,
  situationsApi,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";

type SituationItem = {
  id: string;
  name: string;
  description: string;
  category: string;
};

export function SituationsCatalog() {
  const client = useMemo(() => createDefaultApiClient(), []);
  const [items, setItems] = useState<SituationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await situationsApi.listSituations(client, { limit: 50 });
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setError(formatApiErrorMessage(result.error));
        return;
      }
      const data = result.data as { items: SituationItem[] };
      setItems(data.items ?? []);
    })();
    return () => {
      active = false;
    };
  }, [client]);

  if (loading) {
    return <p className="text-slate-600">Loading situations…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">
          No situations in the database yet. An operator needs to run the
          mobile catalog seed against Postgres.
        </p>
        <Link
          href={AppRoutes.buildDialogue("new")}
          className="inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Describe a new situation
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={AppRoutes.buildDialogue("new")}
        className="block rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 px-4 py-3 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
      >
        + New situation — build your own dialogue
      </Link>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={AppRoutes.situation(item.id)}
              className="block rounded-xl border border-slate-200 bg-white px-4 py-4 hover:border-emerald-300"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                {item.category}
              </p>
              <p className="mt-1 text-lg font-semibold">{item.name}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {item.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
