"use client";

import { useState } from "react";
import { Authenticated, Unauthenticated, useAction } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
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

export default function Home() {
  return (
    <>
      <Authenticated>
        <UserButton />
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInButton>
          <Button>Sign In</Button>
        </SignInButton>
      </Unauthenticated>
    </>
  );
}

function Content() {
  const [threadId, setThreadId] = useState<string | null>(null);
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
      });
    } else {
      void continueThread({ model, prompt, threadId }).then((t) => {
        setMessages((m) => [...m, t]);
      });
    }
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <Input name="prompt" />
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
      </form>
      <div>
        {messages.map((t, i) => (
          <div key={i}>{t}</div>
        ))}
      </div>
    </div>
  );
}
