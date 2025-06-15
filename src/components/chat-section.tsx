"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { useThreadMessages, toUIMessages } from "@convex-dev/agent/react";
import { api } from "../../convex/_generated/api";
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
    { initialNumItems: 10 }
  );

  if (messages.results.length === 0) return;

  return (
    <div className="flex flex-col p-4 gap-2">
      {toUIMessages(messages.results).map((m) => (
        <div
          key={m.key}
          className={cn(
            "p-4",
            m.role === "user" && "bg-neutral-100 ml-auto rounded-lg"
          )}
        >
          {m.content}
        </div>
      ))}
    </div>
  );
}
