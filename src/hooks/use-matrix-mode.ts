import { atom, useAtom } from "jotai";

const matrixModeAtom = atom(false);

export function useMatrixMode() {
  const [matrixMode, setMatrixMode] = useAtom(matrixModeAtom);
  return { matrixMode, setMatrixMode };
}
