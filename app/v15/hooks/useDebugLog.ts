"use client";

import { useEffect } from "react";
import { debug } from "../lib/debugLogger";

export function useDebugLog() {
  useEffect(() => {
    debug.init();
  }, []);

  return debug;
}
