import { MessageSquareTextIcon, PlusIcon, SendIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { socket } from "@/config/socket";
import { toast } from "sonner";
import { type Response, type Message } from "@/lib/types";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { CustomAvatar } from "../custom-avatar";
import type { User } from "better-auth";
import api from "@/config/axios";
import { LoadingState } from "../loading-state";
import { ErrorState } from "../error-state";

type MessageOptionalId = Omit<Message, "id"> & {
  id?: string;
  user: User;
};

export const ChatUI = ({ chatId }: { chatId: string }) => {
  const { data } = authClient.useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<MessageOptionalId[]>([]);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const lastTypingAtRef = useRef(0);

  const markMessagesRead = (messagesToMark?: MessageOptionalId[]) => {
    if (!data?.user) return;
    const sourceMessages = messagesToMark ?? messages;
    const hasUnread = sourceMessages.some(
      (message) => message.sender !== data.user.id && !message.readAt,
    );
    if (!hasUnread) return;

    setMessages((prev) =>
      prev.map((message) =>
        message.sender !== data.user.id && !message.readAt
          ? { ...message, readAt: new Date() }
          : message,
      ),
    );
    socket.emit("mark-read", { chatId });
  };

  useEffect(() => {
    const handleConnect = () => {
      socket.emit("join-chat", chatId);
    };

    handleConnect();
    socket.on("connect", handleConnect);

    socket.on("socket-error", (data) => {
      toast.error(data.message ?? "");
    });

    socket.on("chat-message", (message: MessageOptionalId) => {
      setMessages((prev) => [...prev, message]);
      if (data?.user?.id && message.sender !== data.user.id && !message.readAt) {
        markMessagesRead([message]);
      }
      if (message.user?.id) {
        setTypingUsers((prev) =>
          prev.filter((user) => user.id !== message.user.id),
        );
      }
    });

    socket.on("typing-message", (typingUser: User) => {
      if (data?.user?.id && typingUser.id === data.user.id) {
        return;
      }
      setTypingUsers((prev) =>
        prev.some((user) => user.id === typingUser.id)
          ? prev
          : [...prev, typingUser],
      );
    });

    socket.on("stopped-typing", (typingUser: User) => {
      setTypingUsers((prev) =>
        prev.filter((user) => user.id !== typingUser.id),
      );
    });

    return () => {
      socket.off("socket-error");
      socket.off("chat-message");
      socket.off("typing-message");
      socket.off("stopped-typing");
      socket.off("connect", handleConnect);

      if (socket.connected) {
        if (isTypingRef.current && data?.user) {
          isTypingRef.current = false;
          socket.emit("stopped-typing", { chatId, user: data.user });
        }
        socket.emit("leave-chat", chatId);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId, data?.user?.id]);

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    if (data?.user?.id) {
      markMessagesRead();
    }
  }, [data?.user?.id, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const sendMessage = () => {
    if (!data?.user) return toast.error("Unauthorized");
    if (!messageInput.trim()) return toast.error("Message cannot be empty");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("stopped-typing", { chatId, user: data?.user });
    }
    socket.emit("send-message", { chatId, message: messageInput });
    const newMessage: MessageOptionalId = {
      chatId,
      message: messageInput,
      sender: data?.user.id ?? "",
      createdAt: new Date(),
      updatedAt: new Date(),
      readAt: null,
      user: data.user,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
  };

  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!data?.user) return;

    const now = Date.now();
    lastTypingAtRef.current = now;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing-indicator", { chatId, user: data?.user });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastTypingAtRef.current >= 2000) {
        isTypingRef.current = false;
        socket.emit("stopped-typing", { chatId, user: data?.user });
      }
    }, 2000);
  };

  const formatDate = (d: Date) => {
    if (!d) return;
    const date = new Date(d);
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const datePart = date.toLocaleDateString("en-US", dateOptions);
    const timePart = date.toLocaleTimeString("en-US", timeOptions);

    return `${datePart} at ${timePart}`;
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get<
        Response<{ messages: MessageOptionalId[] }>
      >(`/chats/get-messages/${chatId}`);
      if (response.data.success && response.data.messages) {
        const fetchedMessages = response.data.messages;
        if (data?.user?.id) {
          const hasUnread = fetchedMessages.some(
            (message) =>
              message.sender !== data.user.id && !message.readAt,
          );
          if (hasUnread) {
            setMessages(
              fetchedMessages.map((message) =>
                message.sender !== data.user.id && !message.readAt
                  ? { ...message, readAt: new Date() }
                  : message,
              ),
            );
            socket.emit("mark-read", { chatId });
          } else {
            setMessages(fetchedMessages);
          }
        } else {
          setMessages(fetchedMessages);
        }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full bg-radial from-primary/20 to-background flex flex-col gap-2">
      <div
        className={cn(
          "flex-1 min-h-0 overflow-hidden flex justify-center",
          (loading || error || messages.length === 0) && "items-center",
        )}
      >
        {loading ? (
          <div>
            <LoadingState
              title="Loading messages..."
              description="This may take a few seconds"
            />
          </div>
        ) : error ? (
          <div>
            <ErrorState
              title="Failed to load messages"
              description="Something went wrong. Please try again later."
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-card border py-6 px-8 rounded-lg flex flex-col items-center gap-2">
            <MessageSquareTextIcon className="size-10" />
            <h1 className="text-xl font-medium text-center">No messages yet</h1>
            <p className="text-sm text-muted-foreground">
              Send the first message to start your conversation!
            </p>
          </div>
        ) : (
          <div className="w-full flex-1 overflow-hidden">
            <div className="p-4 flex flex-col gap-2">
              {messages.map((message, index) => (
                <div
                  key={message.id ?? index}
                  className={cn(
                    "flex gap-2 items-start",
                    message.sender === data?.user.id
                      ? "self-end flex-row-reverse"
                      : "self-start",
                  )}
                >
                  <CustomAvatar
                    name={message.user.name}
                    imageUrl={message.user.image}
                  />
                  <div
                    className={cn(
                      "flex flex-col gap-2",
                      message.sender === data?.user.id &&
                        "justify-end items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "w-full max-w-100 rounded-lg p-2 border text-sm",
                        message.sender === data?.user.id
                          ? "bg-primary text-foreground"
                          : "bg-card",
                      )}
                    >
                      {message.message}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {typingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex gap-2 items-start self-start"
                >
                  <CustomAvatar name={user.name} imageUrl={user.image} />
                  <div className="w-full max-w-100 rounded-lg p-2 border text-sm bg-card italic">
                    {user.name} is typing...
                  </div>
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 p-4">
        <Button disabled={loading || error} size="icon" variant="outline">
          <PlusIcon />
        </Button>
        <Input
          value={messageInput}
          onChange={(e) => handleTyping(e)}
          disabled={loading || error}
        />
        <Button disabled={loading || error} onClick={sendMessage} size="icon">
          <SendIcon />
        </Button>
      </div>
    </div>
  );
};
