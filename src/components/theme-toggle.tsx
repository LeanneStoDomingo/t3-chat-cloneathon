"use client";

import {
  LaptopMinimalIcon,
  MoonIcon,
  SunIcon,
  CheckIcon,
  PillIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { Switch } from "~/components/ui/switch";
import { useMatrixMode } from "~/hooks/use-matrix-mode";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const { matrixMode, setMatrixMode } = useMatrixMode();

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className={className}>
            <Button variant="outline" size="icon">
              <SunIcon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className="flex"
            >
              <SunIcon />
              <span>Light</span>
              {theme === "light" && <CheckIcon className="ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="flex">
              <MoonIcon />
              <span>Dark</span>
              {theme === "dark" && <CheckIcon className="ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className="flex"
            >
              <LaptopMinimalIcon />
              <span>System</span>
              {theme === "system" && <CheckIcon className="ml-auto" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <PillIcon color="red" />
          <span>Matrix Mode</span>
          <Switch
            checked={matrixMode}
            onCheckedChange={setMatrixMode}
            onClick={(e) => e.stopPropagation()}
          />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
