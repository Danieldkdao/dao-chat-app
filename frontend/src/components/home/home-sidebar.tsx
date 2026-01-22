import Logo from "@/assets/assets";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "../ui/sidebar";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import api from "@/config/axios";
import type { Chat, ChatParticipant, Response } from "@/lib/types";
import { Loader2Icon, MessageCirclePlusIcon } from "lucide-react";
import type { User } from "better-auth";
import { CustomAvatar } from "../custom-avatar";
import { UserProfileButton } from "./user-profile-button";
import { useLocation, useNavigate } from "react-router";
import { ErrorState } from "../error-state";
import { ChatCommandSelect } from "../chats/chat-command-select";
import { socket } from "@/config/socket";

const EmptyState = ({
  openChange,
}: {
  openChange: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
    <>
      <SidebarMenuItem>
        <Card>
          <CardContent>
            <div className="flex flex-col gap-4 items-center justify-center">
              <p className="text-center text-muted-foreground">
                No chats started. Start by finding someone to chat with!
              </p>
              <Button className="w-full" onClick={() => openChange(true)}>
                <MessageCirclePlusIcon />
                Start new chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </SidebarMenuItem>
    </>
  );
};

const SidebarErrorState = () => {
  return (
    <SidebarMenuItem>
      <ErrorState
        title="Failed to fetch user chats"
        description="Something went wrong. Please try again later."
      />
    </SidebarMenuItem>
  );
};

const LoadingState = () => {
  return (
    <SidebarMenuItem>
      <Card>
        <CardContent>
          <div className="flex flex-col gap-3 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <h1 className="text-lg font-medium">Loading users...</h1>
            <p className="text-center text-muted-foreground">
              This may take a few seconds
            </p>
          </div>
        </CardContent>
      </Card>
    </SidebarMenuItem>
  );
};

type UserChatsResponse = ChatParticipant & {
  chat: Chat & {
    participants: ChatParticipant &
      {
        user: User;
      }[];
  };
  unreadCount: number;
};

const SidebarUsers = ({
  userChats,
  activeUserIds,
}: {
  userChats: UserChatsResponse[];
  activeUserIds: Set<string>;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpen } = useSidebar();

  return userChats.map((userChat) => {
    const isActive = location.pathname === `/chat/${userChat.chatId}`;
    const otherUser = userChat.chat.participants[0]?.user;
    const isUserActive = otherUser ? activeUserIds.has(otherUser.id) : false;
    
    

    return (
      <SidebarMenuItem key={userChat.chatId}>
        <SidebarMenuButton
          className="cursor-pointer h-12"
          onClick={() => {
            setOpen(false);
            navigate(`/chat/${userChat.chatId}`);
          }}
          isActive={isActive}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CustomAvatar
              name={otherUser?.name ?? ""}
              imageUrl={otherUser?.image ?? ""}
            />
            <span className="truncate">{otherUser?.name}</span>
            {isUserActive ? (
              <span className="text-xs text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            ) : null}
          </div>
          {userChat.unreadCount > 0 ? (
            <span className="ml-auto text-xs font-medium bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {userChat.unreadCount}
            </span>
          ) : null}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  });
};

export const HomeSidebar = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userChats, setUserChats] = useState<UserChatsResponse[]>([]);
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());
  const location = useLocation();

  const fetchUsers = async () => {
    const response = await api.get<
      Response<{ userChats: UserChatsResponse[] }>
    >("/users/get-user-chats");
    if (response.data.success && response.data.userChats) {
      setLoading(false);
      setUserChats(response.data.userChats);
    } else {
      setLoading(false);
      setError(true);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [location.pathname]);

  useEffect(() => {
    const handleActiveUsers = (payload: { userIds: string[] }) => {
      setActiveUserIds(new Set(payload.userIds));
    };

    const handleUserActive = (payload: { userId: string }) => {
      setActiveUserIds((prev) => new Set([...prev, payload.userId]));
    };

    const handleUserInactive = (payload: { userId: string }) => {
      setActiveUserIds((prev) => {
        const next = new Set(prev);
        next.delete(payload.userId);
        return next;
      });
    };

    const handleChatUnread = (payload: {
      chatId: string;
      unreadCount: number;
    }) => {
      if (location.pathname === `/chat/${payload.chatId}`) {
        return;
      }
      setUserChats((prev) =>
        prev.map((chat) =>
          chat.chatId === payload.chatId
            ? { ...chat, unreadCount: chat.unreadCount + payload.unreadCount }
            : chat,
        ),
      );
    };

    const handleChatRead = (payload: { chatId: string }) => {
      setUserChats((prev) =>
        prev.map((chat) =>
          chat.chatId === payload.chatId ? { ...chat, unreadCount: 0 } : chat,
        ),
      );
    };

    const handleCreateChat = () => {
      fetchUsers();
    };

    socket.on("active-users", handleActiveUsers);
    socket.on("user-active", handleUserActive);
    socket.on("user-inactive", handleUserInactive);
    socket.on("chat-unread", handleChatUnread);
    socket.on("chat-read", handleChatRead);
    socket.on("chat-created", handleCreateChat);

    return () => {
      socket.off("active-users", handleActiveUsers);
      socket.off("user-active", handleUserActive);
      socket.off("user-inactive", handleUserInactive);
      socket.off("chat-unread", handleChatUnread);
      socket.off("chat-read", handleChatRead);
      socket.off("chat-created", handleCreateChat);
    };
  }, [location.pathname]);

  return (
    <>
      <ChatCommandSelect
        open={isUserSelectOpen}
        openChange={setIsUserSelectOpen}
      />
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-4 pt-2 px-4">
            <img src={Logo} alt="Logo" className="size-12" />
            <h1 className="text-3xl font-bold">DaoChat</h1>
          </div>
        </SidebarHeader>
        <div className="py-2 px-4 mb-2">
          <Separator />
        </div>
        <div className="px-4 mb-2">
          <Button className="w-full" onClick={() => setIsUserSelectOpen(true)}>
            <MessageCirclePlusIcon />
            Start new chat
          </Button>
        </div>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {loading ? (
                  <LoadingState />
                ) : error ? (
                  <SidebarErrorState />
                ) : userChats.length === 0 ? (
                  <EmptyState openChange={setIsUserSelectOpen} />
                ) : (
                  <SidebarUsers
                    userChats={userChats}
                    activeUserIds={activeUserIds}
                  />
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserProfileButton />
        </SidebarFooter>
      </Sidebar>
    </>
  );
};
