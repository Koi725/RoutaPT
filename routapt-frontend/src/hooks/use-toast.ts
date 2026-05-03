import { useState, useCallback } from "react";

export function useToast(duration = 2800) {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback(
    (msg: string) => {
      setMessage(msg);
      setTimeout(() => setMessage(null), duration);
    },
    [duration]
  );

  const hide = useCallback(() => setMessage(null), []);

  return { message, show, hide };
}