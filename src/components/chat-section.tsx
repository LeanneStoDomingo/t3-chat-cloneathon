"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import {
  useThreadMessages,
  toUIMessages,
  optimisticallySendMessage,
  type UIMessage,
} from "@convex-dev/agent/react";
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
import { useEventListener } from "usehooks-ts";

export function ChatSection(props: { threadId: string | null }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<TChatModels>("gemini");
  const [firstMessage, setFirstMessage] = useState<string>();

  return (
    <div className="flex w-full flex-col" ref={divRef}>
      {!props.threadId && !!firstMessage ? (
        <div className="flex flex-col gap-2 p-4">
          <Message role="user" content={firstMessage} />
        </div>
      ) : null}
      {!!props.threadId && (
        <ChatMessages threadId={props.threadId} model={model} />
      )}
      <PromptForm
        threadId={props.threadId}
        model={model}
        setModel={setModel}
        divRef={divRef}
        setFirstMessage={setFirstMessage}
      />
    </div>
  );
}

function PromptForm(props: {
  threadId: string | null;
  model: TChatModels;
  setModel: (m: TChatModels) => void;
  divRef: React.RefObject<HTMLDivElement | null>;
  setFirstMessage: (m: string) => void;
}) {
  const router = useRouter();

  const { theme } = useTheme();
  const isMatrixTheme = theme === "matrix";

  const inputRef = useRef<HTMLInputElement>(null);

  useEventListener(
    "click",
    () => {
      inputRef.current?.focus();
    },
    props.divRef as React.RefObject<HTMLDivElement>,
  );

  const sendMessage = useMutation(api.message.send).withOptimisticUpdate(
    (store, args) => {
      if (!args.threadId) return;
      return optimisticallySendMessage(api.message.list)(store, {
        threadId: args.threadId,
        prompt: args.prompt,
      });
    },
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const prompt = formData.get("prompt") as string;

    e.currentTarget.reset();

    props.setFirstMessage(prompt);

    void sendMessage({
      model: props.model,
      prompt,
      threadId: props.threadId,
    }).then((data) => {
      if (props.threadId) return;
      router.push(`/chat/${data.threadId}`);
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex flex-col gap-4",
        !isMatrixTheme && "bottom-0 mt-auto p-8",
        isMatrixTheme && "p-4",
      )}
    >
      <div className={cn("flex items-center", isMatrixTheme && "p-4")}>
        {isMatrixTheme ? <div>{`>`}</div> : null}
        <Input
          name="prompt"
          className={cn(
            "grow",
            isMatrixTheme &&
              "focus-visible:border-ring border-0 border-black shadow-none focus-visible:ring-0",
          )}
          autoComplete="off"
          ref={inputRef}
        />
      </div>
      <div
        className={cn(
          "flex justify-between",
          isMatrixTheme && "absolute bottom-0 mt-auto pb-4",
        )}
      >
        <Select
          name="model"
          value={props.model}
          onValueChange={(v) => props.setModel(v as TChatModels)}
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
        <Button type="submit" className={cn(isMatrixTheme && "hidden")}>
          Send
        </Button>
      </div>
    </form>
  );
}

function ChatMessages(props: { threadId: string; model: TChatModels }) {
  const messages = useThreadMessages(
    api.message.list,
    { threadId: props.threadId, model: props.model },
    { initialNumItems: 10, stream: true },
  );

  if (messages.results.length === 0) return;

  return (
    <div className="flex flex-col gap-2 p-4">
      {toUIMessages(messages.results).map((m) => (
        <Message key={m.key} role={m.role} content={m.content} />
      ))}
    </div>
  );
}

function Message(props: {
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
