"use client";

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
                <span>{thread.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
