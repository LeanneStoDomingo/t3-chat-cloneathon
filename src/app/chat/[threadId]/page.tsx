"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Authenticated, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ChatSection } from "~/components/chat/chat-section";

export default function Thread() {
  const params = useParams<{ threadId: string }>();
  const router = useRouter();

  const doesThreadExist = useQuery(api.thread.exists, {
    threadId: params.threadId,
  });

  useEffect(() => {
    if (doesThreadExist !== undefined && !doesThreadExist) router.push("/");
  }, [router, doesThreadExist]);

  if (!doesThreadExist) return;

  return (
    <Authenticated>
      <ChatSection threadId={params.threadId} />
    </Authenticated>
  );
}
