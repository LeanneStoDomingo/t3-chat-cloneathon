"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { useThreadMessages, toUIMessages } from "@convex-dev/agent/react";
import { api } from "../../convex/_generated/api";
import Markdown from "markdown-to-jsx";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
  vs,
  stackoverflowDark,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { ClipboardIcon, ClipboardCheckIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import typography from "~/components/ui/typography";
import { useCopyToClipboard } from "~/hooks/use-copy-to-clipboard";
import { modelStrings, type TChatModels } from "~/lib/chat-models";
import { cn } from "~/lib/utils";
import { useTheme } from "next-themes";

export function ChatSection(props: { threadId: string | null }) {
  const router = useRouter();

  const [model, setModel] = useState<TChatModels>("gemini");

  const sendMessage = useAction(api.chat.sendMessage);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const prompt = formData.get("prompt") as string;

    e.currentTarget.reset();

    void sendMessage({ model, prompt, threadId: props.threadId }).then(
      (data) => {
        if (props.threadId) return;
        router.push(`/chat/${data.threadId}`);
      }
    );
  };

  return (
    <div className="w-full flex flex-col">
      {!!props.threadId && (
        <ChatMessages threadId={props.threadId} model={model} />
      )}
      <form
        onSubmit={onSubmit}
        className="flex flex-col p-8 gap-4 bottom-0 mt-auto"
      >
        <Input name="prompt" className="grow" autoComplete="off" />
        <div className="flex justify-between">
          <Select
            name="model"
            value={model}
            onValueChange={(v) => setModel(v as TChatModels)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {modelStrings.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  );
}

function ChatMessages(props: { threadId: string; model: TChatModels }) {
  const messages = useThreadMessages(
    api.chat.listThreadMessages,
    { threadId: props.threadId, model: props.model },
    { initialNumItems: 10, stream: true }
  );

  if (messages.results.length === 0) return;

  return (
    <div className="flex flex-col p-4 gap-2">
      {toUIMessages(messages.results).map((m) => (
        <div
          key={m.key}
          className={cn(
            "p-4",
            m.role === "user" &&
              "bg-neutral-100 ml-auto rounded-lg dark:bg-neutral-800"
          )}
        >
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
            {m.content}
          </Markdown>
        </div>
      ))}
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
        "p-2 rounded-md my-2",
        resolvedTheme !== "matrix"
          ? "bg-neutral-100 dark:bg-neutral-800"
          : "bg-neutral-900"
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
                  : "hover:bg-[var(--sidebar-foreground)]"
              )}
            >
              {!copiedText && <ClipboardIcon />}
              {!!copiedText && <ClipboardCheckIcon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy to Clipboard</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <SyntaxHighlighter
        language={language}
        style={
          resolvedTheme === "dark" || resolvedTheme === "matrix"
            ? stackoverflowDark
            : vs
        }
        customStyle={{
          borderRadius: "calc(var(--radius)",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
