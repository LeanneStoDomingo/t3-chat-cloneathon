"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { optimisticallySendMessage } from "@convex-dev/agent/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { modelStrings, type TChatModels } from "~/lib/chat-models";
import { cn } from "~/lib/utils";
import { useTheme } from "next-themes";
import { useEventListener } from "usehooks-ts";
import { ChatMessages, Message } from "./chat-messages";

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
          ref={inputRef}
          autoComplete="off"
          className={cn(
            "grow",
            isMatrixTheme &&
              "focus-visible:border-ring border-0 border-black shadow-none focus-visible:ring-0",
          )}
        />
      </div>
      <div className={cn("flex justify-between", isMatrixTheme && "hidden")}>
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
