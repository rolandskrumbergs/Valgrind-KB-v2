import { useState, useEffect, useCallback } from "react";
import { subscriptionApi, type Subscription } from "@/lib/api";

export function useSubscriptions(organizationId: string) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await subscriptionApi.getByOrganization(organizationId);
    if (result.error) {
      setError(result.error);
    } else {
      setSubscriptions(result.data ?? []);
    }
    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const createSeats = async (count: number) => {
    const result = await subscriptionApi.createSeats(organizationId, count);
    if (result.error) return { error: result.error };
    await load();
    return { data: result.data };
  };

  const assign = async (subscriptionId: string, userId: string) => {
    const result = await subscriptionApi.assign(
      organizationId,
      subscriptionId,
      userId
    );
    if (result.error) return { error: result.error };
    await load();
    return { data: result.data };
  };

  const unassign = async (subscriptionId: string) => {
    const result = await subscriptionApi.unassign(
      organizationId,
      subscriptionId
    );
    if (result.error) return { error: result.error };
    await load();
    return { data: result.data };
  };

  const remove = async (subscriptionId: string) => {
    const result = await subscriptionApi.delete(
      organizationId,
      subscriptionId
    );
    if (result.error) return { error: result.error };
    await load();
    return {};
  };

  return {
    subscriptions,
    isLoading,
    error,
    reload: load,
    createSeats,
    assign,
    unassign,
    remove,
  };
}
