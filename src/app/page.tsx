"use client";

import { Authenticated } from "convex/react";
import { ChatSection } from "~/components/chat-section";

export default function Home() {
  return (
    <Authenticated>
      <ChatSection threadId={null} />
    </Authenticated>
  );
}
