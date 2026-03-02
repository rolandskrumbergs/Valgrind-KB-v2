import { useState, useEffect, useCallback } from "react";
import {
  organizationApi,
  type Organization,
  type CreateOrganizationRequest,
  type UpdateOrganizationRequest,
} from "@/lib/api";

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await organizationApi.getAll();
    if (result.error) {
      setError(result.error);
    } else {
      setOrganizations(result.data ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (req: CreateOrganizationRequest) => {
    const result = await organizationApi.create(req);
    if (result.error) return { error: result.error };
    await load();
    return { data: result.data };
  };

  const update = async (id: string, req: UpdateOrganizationRequest) => {
    const result = await organizationApi.update(id, req);
    if (result.error) return { error: result.error };
    await load();
    return { data: result.data };
  };

  const remove = async (id: string) => {
    const result = await organizationApi.delete(id);
    if (result.error) return { error: result.error };
    await load();
    return {};
  };

  return { organizations, isLoading, error, reload: load, create, update, remove };
}

export function useOrganization(id: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await organizationApi.getById(id);
    if (result.error) {
      setError(result.error);
    } else {
      setOrganization(result.data ?? null);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { organization, isLoading, error, reload: load };
}
