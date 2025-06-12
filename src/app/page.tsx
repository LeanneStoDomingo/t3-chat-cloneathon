"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "~/components/ui/button";

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
  const messages = useQuery(api.messages.getForCurrentUser);
  return (
    <div>
      <div>Authenticated content: {messages?.length}</div>
      <div>{messages?.map((m) => <div key={m._id}>{m.body}</div>)}</div>
    </div>
  );
}
