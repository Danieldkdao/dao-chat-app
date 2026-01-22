import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import type { User } from "better-auth";
import api from "@/config/axios";
import type { Response } from "@/lib/types";
import { CustomAvatar } from "../custom-avatar";
import { LoadingState } from "../loading-state";
import { ErrorState } from "../error-state";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useSidebar } from "../ui/sidebar";
import { socket } from "@/config/socket";

type ChatCommandSelect = {
  open: boolean;
  openChange: Dispatch<SetStateAction<boolean>>;
};

export const ChatCommandSelect = ({ open, openChange }: ChatCommandSelect) => {
  const [loading, setLoading] = useState(true);
  const [redirectLoading, setRedirectLoading] = useState(false);
  const [error, setError] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();
  const { setOpen } = useSidebar();

  const handleChatCreated = () => {
    fetchUsers();
  };

  useEffect(() => {
    socket.on("chat-created", handleChatCreated);

    return () => {
      socket.off("chat-created", handleChatCreated);
    };
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const response =
      await api.get<Response<{ users: User[] }>>("/users/get-users");
    if (response.data.success && response.data.users) {
      setLoading(false);
      setUsers(response.data.users);
    } else {
      setLoading(false);
      setError(true);
    }
  };

  const handleSelect = async (userId: string) => {
    if (redirectLoading) return;
    setRedirectLoading(true);
    try {
      const response = await api.post<Response<{ chatId: string }>>(
        "/chats/create-chat",
        {
          otherParticipantId: userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success && response.data.chatId) {
        socket.emit("create-chat", userId);
        toast.success(response.data.message);
        setOpen(false);
        openChange(false);
        navigate(`/chat/${response.data.chatId}`);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to created chat");
    } finally {
      setRedirectLoading(false);
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={openChange}>
      <CommandInput placeholder="Search for users..." />
      <CommandList>
        <CommandEmpty>
          <span className="text-muted-foreground text-sm">
            No options found
          </span>
        </CommandEmpty>
        {loading && (
          <LoadingState
            title="Loading users"
            description="This may take a few seconds"
          />
        )}
        {error && (
          <ErrorState
            title="Failed to fetch users"
            description="Something went wrong. Please try again later."
          />
        )}
        {!loading &&
          !error &&
          users.map((user) => (
            <CommandItem
              key={user.id}
              onSelect={() => {
                handleSelect(user.id);
              }}
              disabled={redirectLoading}
            >
              <div className="flex items-center gap-2 w-full">
                <CustomAvatar name={user.name} imageUrl={user.image} />
                <span>{user.name}</span>
              </div>
            </CommandItem>
          ))}
      </CommandList>
    </CommandDialog>
  );
};
