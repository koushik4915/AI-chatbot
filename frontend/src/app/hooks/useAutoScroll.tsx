import { useEffect } from "react";

export function useAutoScroll(ref: React.RefObject<HTMLElement | null>, deps: any[]) {
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [deps]);
}

