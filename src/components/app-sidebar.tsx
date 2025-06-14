"use client";

import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import {
  Authenticated,
  Unauthenticated,
  usePaginatedQuery,
} from "convex/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Button } from "./ui/button";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="text-center">T3 Chat Cloneathon</SidebarHeader>
      <SidebarContent>
        <Unauthenticated>
          <span className="text-center">Sign in to chat</span>
        </Unauthenticated>
        <Authenticated>
          <SidebarGroup>
            <SidebarGroupContent>
              <Button className="w-full" asChild>
                <Link href="/">New Chat</Link>
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
          <ChatGroup />
        </Authenticated>
      </SidebarContent>
      <SidebarFooter>
        <Unauthenticated>
          <SignInButton>
            <Button>Sign In</Button>
          </SignInButton>
        </Unauthenticated>
        <Authenticated>
          <UserButton showName />
        </Authenticated>
      </SidebarFooter>
    </Sidebar>
  );
}

function ChatGroup() {
  const threads = usePaginatedQuery(
    api.chat.listThreads,
    {},
    { initialNumItems: 20 }
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {threads.results.map((thread) => (
            <SidebarMenuItem key={thread._id}>
              <SidebarMenuButton asChild>
                <Link href={`/chat/${thread._id}`}>{thread.title}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
