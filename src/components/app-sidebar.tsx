"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import {
  Authenticated,
  Unauthenticated,
  useMutation,
  usePaginatedQuery,
} from "convex/react";
import {
  EllipsisIcon,
  Trash2Icon,
  ArchiveIcon,
  ArchiveRestoreIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useIsMobile } from "~/hooks/use-mobile";
import { cn } from "~/lib/utils";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="text-center gap-4">
        <div>T3 Chat Cloneathon</div>
        <Authenticated>
          <Button className="w-full" asChild>
            <Link href="/">New Chat</Link>
          </Button>
        </Authenticated>
      </SidebarHeader>
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
  const params = useParams<{ threadId: string }>();
  const router = useRouter();

  const isMobile = useIsMobile();

  const archiveThread = useMutation(api.chat.archiveThread);
  const deleteThread = useMutation(api.chat.deleteThread);

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
              <SidebarMenuButton
                asChild
                className={cn(
                  "truncate",
                  params.threadId === thread._id &&
                    "bg-neutral-200 hover:bg-neutral-200"
                )}
              >
                <Link href={`/chat/${thread._id}`}>{thread.title}</Link>
              </SidebarMenuButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    showOnHover
                    className="data-[state=open]:bg-accent rounded-sm"
                  >
                    <EllipsisIcon />
                    <span className="sr-only">Chat Options</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-24 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void archiveThread({
                        threadId: thread._id,
                        status:
                          thread.status === "archived" ? "active" : "archived",
                      });
                    }}
                  >
                    {thread.status === "archived" ? (
                      <>
                        <ArchiveRestoreIcon />
                        <span>Unarchive</span>
                      </>
                    ) : (
                      <>
                        <ArchiveIcon />
                        <span>Archive</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void deleteThread({ threadId: thread._id }).then(
                        (data) => {
                          if (data.isDone) router.push("/");
                        }
                      );
                    }}
                  >
                    <Trash2Icon />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
