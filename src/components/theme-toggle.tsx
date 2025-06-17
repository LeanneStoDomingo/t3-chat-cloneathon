"use client";

import {
  LaptopMinimalIcon,
  MoonIcon,
  SunIcon,
  CheckIcon,
  RabbitIcon,
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
} from "~/components/ui/context-menu";
import { Switch } from "~/components/ui/switch";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

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
          <RabbitIcon color="gray" fill="white" />
          <span>Wake up...</span>
          <Switch
            checked={theme === "matrix"}
            onCheckedChange={(e) => setTheme(e ? "matrix" : "system")}
            onClick={(e) => e.stopPropagation()}
          />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
