import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

/** Client-side navigation to an `AppRoutes` href (path plus optional query). */
export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (href: string, options: { replace?: boolean } = {}) =>
      navigate({ href, replace: options.replace }),
    [navigate],
  );
}
