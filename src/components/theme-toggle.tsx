"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LaptopMinimalIcon,
  MoonIcon,
  SunIcon,
  CheckIcon,
  RabbitIcon,
  BedDoubleIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { MatrixRainingLetters } from "react-mdr";
import Typewriter from "typewriter-effect";
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
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isMatrixTheme = theme === "matrix";

  const [showTyping, setShowTyping] = useState(false);
  const [showMatrixRain, setShowMatrixRain] = useState(false);

  useEffect(() => {
    if (!isMatrixTheme) return;

    const RAIN_TIME = 5000;

    const showMatrixRainTimeout = setTimeout(() => {
      router.push("/");
      setShowMatrixRain(false);
      setShowTyping(true);
    }, RAIN_TIME);

    const showTypingTimeout = setTimeout(() => {
      setShowTyping(false);
    }, TYPING_TIME + RAIN_TIME);

    return () => {
      clearTimeout(showMatrixRainTimeout);
      clearTimeout(showTypingTimeout);
    };
  }, [router, isMatrixTheme]);

  return (
    <>
      {showTyping && <ConsoleTyping />}
      {showMatrixRain && <Matrix />}
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
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="flex"
              >
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
            {isMatrixTheme ? (
              <BedDoubleIcon />
            ) : (
              <RabbitIcon color="gray" fill="white" />
            )}
            <span>{isMatrixTheme ? "Got to sleep" : "Wake up..."}</span>
            <Switch
              checked={isMatrixTheme}
              onCheckedChange={(e) => {
                setShowMatrixRain(e);
                setTheme(e ? "matrix" : "system");
              }}
            />
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}

const PAUSE_DELAY = 1500;
const TYPING_DELAY = 75;
const DELETE_SPEED = 50;

const TYPING_STRINGS = [
  `Wake up...`,
  "The Matrix has you...",
  "Follow the white rabbit.",
] as const;

const TYPING_TIME = TYPING_STRINGS.reduce(
  (accumulator, currentValue) =>
    accumulator +
    currentValue.length * (TYPING_DELAY + DELETE_SPEED) +
    PAUSE_DELAY,
  0,
);

function ConsoleTyping() {
  return (
    <div className="fixed top-0 left-0 z-11 h-full w-full bg-black p-20">
      <Typewriter
        onInit={(typewriter) => {
          typewriter
            .typeString(TYPING_STRINGS[0])
            .pauseFor(PAUSE_DELAY)
            .deleteAll()
            .typeString(TYPING_STRINGS[1])
            .pauseFor(PAUSE_DELAY)
            .deleteAll()
            .typeString(TYPING_STRINGS[2])
            .pauseFor(PAUSE_DELAY)
            .deleteAll()
            .start();
        }}
        options={{ delay: TYPING_DELAY, deleteSpeed: DELETE_SPEED }}
      />
    </div>
  );
}
function Matrix() {
  // TODO: tailwindcss opacity animation
  return (
    <div className="fixed bottom-0 left-0 z-11 h-full w-full bg-black">
      <MatrixRainingLetters custom_class="m-0 p-0" />
    </div>
  );
}
