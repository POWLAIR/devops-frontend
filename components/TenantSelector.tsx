'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

type TenantOption = {
  id: string;
  label: string;
};

const FALLBACK_TENANTS: TenantOption[] = [
  { id: '1574b85d-a3df-400f-9e82-98831aa32934', label: 'Default' },
  { id: '36ee6e56-0344-4a85-999f-4730bf5c38c2', label: 'Tech Store' },
  { id: '1ddfe264-3415-4dec-9bc1-af3e60809745', label: 'Fashion Boutique' },
];

function persistTenant(tenantId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tenantId', tenantId);
    // Définir le cookie avec une durée de vie de 7 jours
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `x-tenant-id=${tenantId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    console.log('[TenantSelector] Cookie set:', tenantId);
  } catch (error) {
    console.error('[TenantSelector] Error setting cookie:', error);
  }
}

function readTenant(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = localStorage.getItem('tenantId');
    if (stored) return stored;
  } catch {
    // ignore
  }
  return undefined;
}

export default function TenantSelector() {
  const [tenantId, setTenantId] = useState<string>(FALLBACK_TENANTS[0].id);
  const [tenants, setTenants] = useState<TenantOption[]>(FALLBACK_TENANTS);

  useEffect(() => {
    const existing = readTenant();
    if (existing) {
      setTenantId(existing);
    } else {
      persistTenant(FALLBACK_TENANTS[0].id);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTenants = async () => {
      try {
        const data = await apiClient.getTenants();
        if (!mounted) return;

        const mapped = Array.isArray(data)
          ? data
              .map((t) => ({ id: t.id, label: t.name }))
              .filter((t) => t.id && t.label)
          : [];

        if (mapped.length) {
          setTenants(mapped);
          setTenantId((prev) => {
            if (mapped.some((t) => t.id === prev)) {
              return prev;
            }
            const nextId =
              readTenant() || mapped[0].id || FALLBACK_TENANTS[0].id;
            persistTenant(nextId);
            return nextId;
          });
        }
      } catch {
        if (!mounted) return;
        setTenants(FALLBACK_TENANTS);
      }
    };

    loadTenants();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTenantId(value);
    persistTenant(value);
    // Rechargement léger pour propager le cookie aux requêtes server-side
    window.location.reload();
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <label htmlFor="tenant-select" className="text-blue-50 whitespace-nowrap">
        Tenant
      </label>
      <select
        id="tenant-select"
        value={tenantId}
        onChange={handleChange}
        className="bg-blue-800 text-white px-2 py-1 rounded-md border border-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
      >
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}


