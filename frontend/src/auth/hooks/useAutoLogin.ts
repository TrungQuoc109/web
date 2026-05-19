import { useEffect, useRef } from "react";

import { defaultCredentials } from "@/auth/config/devAuth";
import { useLoginMutation } from "@/auth/hooks/useLoginMutation";

export function useAutoLogin(enabled: boolean) {
  const attempted = useRef(false);
  const login = useLoginMutation();

  useEffect(() => {
    if (!enabled) return;
    if (attempted.current) return;
    attempted.current = true;

    void login.mutateAsync(defaultCredentials);
  }, [enabled, login]);

  return login;
}

