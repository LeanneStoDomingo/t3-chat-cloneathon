"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
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

  const [threadId, setThreadId] = useState(props.threadId);
  const [messages, setMessages] = useState<string[]>([]);

  const createThread = useAction(api.chat.createThread);
  const continueThread = useAction(api.chat.continueThread);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const prompt = formData.get("prompt") as string;
    const model = formData.get("model") as "gemini" | "deepseek";

    if (!threadId) {
      void createThread({ model, prompt }).then((t) => {
        setThreadId(t.threadId);
        setMessages((m) => [...m, t.text]);
        router.push(`/chat/${t.threadId}`);
      });
    } else {
      void continueThread({ model, prompt, threadId }).then((t) => {
        setMessages((m) => [...m, t]);
      });
    }
  };

  return (
    <div className="w-full">
      <div>
        {messages.map((t, i) => (
          <div key={i}>{t}</div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex flex-col p-8 gap-4">
        <Input name="prompt" className="grow " />
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
