"use client";

import { useEffect, useRef } from "react";
import {
  useThreadMessages,
  toUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { api } from "../../../convex/_generated/api";
import Markdown from "markdown-to-jsx";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
  vs,
  stackoverflowDark,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { ClipboardIcon, ClipboardCheckIcon, EllipsisIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import typography from "~/components/ui/typography";
import { useCopyToClipboard } from "~/hooks/use-copy-to-clipboard";
import { type TChatModels } from "~/lib/chat-models";
import { cn } from "~/lib/utils";
import { useTheme } from "next-themes";

export function ChatMessages(props: { threadId: string; model: TChatModels }) {
  const { resolvedTheme } = useTheme();

  const divRef = useRef<HTMLDivElement>(null);

  divRef.current?.scrollIntoView();

  const messages = useThreadMessages(
    api.message.list,
    { threadId: props.threadId, model: props.model },
    { initialNumItems: 10, stream: true },
  );

  const formattedMessages = toUIMessages(messages.results);

  const isStreaming = formattedMessages.reduce((acc, curr) => {
    return acc || curr.status === "streaming";
  }, false);

  useEffect(() => {
    if (isStreaming) divRef.current?.scrollIntoView();
  }, [isStreaming]);

  if (messages.results.length === 0) return;

  return (
    <div className="flex flex-col gap-2 p-4">
      {formattedMessages.map((m) => (
        <Message key={m.key} role={m.role} content={m.content} />
      ))}
      {isStreaming ? (
        <EllipsisIcon
          size={50}
          className={cn(
            "ml-4 animate-bounce",
            resolvedTheme === "light" && "text-gray-300",
            resolvedTheme === "dark" && "text-gray-700",
            resolvedTheme === "matrix" && "hidden",
          )}
        />
      ) : null}
      <div ref={divRef} className="h-0 w-0" />
    </div>
  );
}

export function Message(props: {
  role: UIMessage["role"];
  content: UIMessage["content"];
}) {
  const { theme } = useTheme();
  const isMatrixTheme = theme === "matrix";

  return (
    <div
      className={cn(
        "flex gap-2 p-4",
        !isMatrixTheme &&
          props.role === "user" &&
          "ml-auto rounded-lg bg-neutral-100 dark:bg-neutral-800",
      )}
    >
      {isMatrixTheme && props.role === "user" ? <div>{">"}</div> : null}
      <Markdown
        options={{
          overrides: {
            code: { component: MarkdownToSyntaxHighlighter },
            h1: { props: { className: typography.h1 } },
            h2: { props: { className: typography.h2 } },
            h3: { props: { className: typography.h3 } },
            h4: { props: { className: typography.h4 } },
            p: { props: { className: typography.p } },
            ul: { props: { className: typography.ul } },
            blockquote: { props: { classname: typography.blockquote } },
          },
        }}
      >
        {props.content}
      </Markdown>
    </div>
  );
}

function MarkdownToSyntaxHighlighter({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"code">, "children"> & {
  children: string | string[];
}) {
  const { resolvedTheme } = useTheme();
  const { copiedText, copyToClipboard } = useCopyToClipboard();

  const language = className
    ?.split(" ")
    ?.find((text) => text.startsWith("lang-"))
    ?.replace("lang-", "");

  const flatChildren = [children].flat(2).join(" ");

  if (!language)
    return (
      <code className={cn(className, typography.code)} {...props}>
        {flatChildren}
      </code>
    );

  return (
    <div
      className={cn(
        "my-2 rounded-md p-2",
        resolvedTheme !== "matrix"
          ? "bg-neutral-100 dark:bg-neutral-800"
          : "bg-neutral-900",
      )}
    >
      <div className="flex items-center justify-between pb-2">
        <div className="p-1">{language}</div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => void copyToClipboard(flatChildren)}
              variant="ghost"
              size="icon"
              className={cn(
                resolvedTheme !== "matrix"
                  ? "hover:bg-neutral-200"
                  : "hover:bg-[var(--sidebar-foreground)]",
              )}
            >
              {!copiedText ? <ClipboardIcon /> : <ClipboardCheckIcon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy to Clipboard</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <SyntaxHighlighter
        language={language}
        style={resolvedTheme === "light" ? vs : stackoverflowDark}
        customStyle={{
          borderRadius: "calc(var(--radius)",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
