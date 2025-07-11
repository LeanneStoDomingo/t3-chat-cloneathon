// source: https://usehooks-ts.com/react-hook/use-copy-to-clipboard

import { useCallback, useState } from "react";

type CopiedValue = string | null;

export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<CopiedValue>(null);

  const copyToClipboard = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported");
      return false;
    }

    // Try to save to clipboard then save it in the state if worked
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.warn("Copy failed", error);
      setCopiedText(null);
      return false;
    }
  }, []);

  return { copiedText, copyToClipboard };
}
