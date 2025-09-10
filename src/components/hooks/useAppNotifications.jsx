import { useToast } from "@/components/ui/use-toast";

/**
 * Application-specific notifications hook that wraps the base toast system
 * Provides consistent styling, RTL support, and standardized notification types
 */
export function useAppNotifications() {
  const { toast } = useToast();

  const success = (title, description = "") => {
    toast({
      title,
      description,
      className: "bg-green-100 text-green-800 text-right border-green-200",
      dir: "rtl",
      duration: 4000,
    });
  };

  const error = (title, description = "") => {
    toast({
      title,
      description,
      variant: "destructive",
      dir: "rtl",
      duration: 6000, // Longer duration for errors so users have time to read
    });
  };

  const info = (title, description = "") => {
    toast({
      title,
      description,
      className: "bg-blue-100 text-blue-800 text-right border-blue-200",
      dir: "rtl",
      duration: 4000,
    });
  };

  const warning = (title, description = "") => {
    toast({
      title,
      description,
      className: "bg-orange-100 text-orange-800 text-right border-orange-200",
      dir: "rtl",
      duration: 5000,
    });
  };

  return {
    success,
    error,
    info,
    warning,
  };
}