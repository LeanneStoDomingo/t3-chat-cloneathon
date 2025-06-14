"use client";

import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import {
  useThreadMessages,
  toUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
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

export function ChatSection(props: { threadId: string | null }) {
  const router = useRouter();

  const createThread = useAction(api.chat.createThread);
  const continueThread = useAction(api.chat.continueThread);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const prompt = formData.get("prompt") as string;
    const model = formData.get("model") as "gemini" | "deepseek";

    e.currentTarget.reset();

    if (!props.threadId) {
      void createThread({ model, prompt }).then((t) => {
        router.push(`/chat/${t.threadId}`);
      });
    } else {
      void continueThread({ model, prompt, threadId: props.threadId });
    }
  };

  return (
    <div className="w-full flex flex-col">
      {!!props.threadId && <ChatMessages threadId={props.threadId} />}
      <form
        onSubmit={onSubmit}
        className="flex flex-col p-8 gap-4 bottom-0 mt-auto"
      >
        <Input name="prompt" className="grow" />
        <div className="flex justify-between">
          <Select name="model" defaultValue="gemini">
            <SelectTrigger>
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="deepseek">DeepSeek V3 0324</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  );
}

function ChatMessages(props: { threadId: string }) {
  const messages = useThreadMessages(
    api.chat.listThreadMessages,
    { threadId: props.threadId },
    { initialNumItems: 10 }
  );

  return (
    <>
      {messages.results.length > 0 && (
        <div className="flex flex-col p-4 gap-4">
          {toUIMessages(messages.results).map((m) =>
            m.role === "user" ? (
              <UserMessage key={m.key} message={m} />
            ) : (
              <BotMessage key={m.key} message={m} />
            )
          )}
        </div>
      )}
    </>
  );
}

function UserMessage(props: { message: UIMessage }) {
  return (
    <div className="bg-neutral-100 ml-auto p-4 rounded-lg">
      {props.message.content}
    </div>
  );
}

function BotMessage(props: { message: UIMessage }) {
  return <div className="mr-auto p-4">{props.message.content}</div>;
}
