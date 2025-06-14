"use client";

import { useParams } from "next/navigation";
import { Authenticated } from "convex/react";
import { ChatSection } from "~/components/chat-section";

export default function Thread() {
  const params = useParams<{ threadId: string }>();
  return (
    <Authenticated>
      <ChatSection threadId={params.threadId} />
    </Authenticated>
  );
}
