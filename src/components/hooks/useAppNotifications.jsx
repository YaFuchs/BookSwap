import { useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for displaying toast notifications.
 * Returns a stable object with memoized functions for different notification types.
 * This prevents re-renders in components that use this hook as a dependency.
 */
export function useAppNotifications() {
  const { toast } = useToast();

  const success = useCallback(
    (title, description) => {
      toast({
        title: title,
        description: description,
        className: "bg-green-100 text-green-800 border-green-200",
      });
    },
    [toast]
  );

  const error = useCallback(
    (title, description) => {
      toast({
        title: title,
        description: description,
        variant: "destructive",
      });
    },
    [toast]
  );

  const info = useCallback(
    (title, description) => {
      toast({
        title: title,
        description: description,
      });
    },
    [toast]
  );

  // useMemo ensures the returned object has a stable reference
  return useMemo(
    () => ({
      success,
      error,
      info,
    }),
    [success, error, info]
  );
}