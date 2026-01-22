import { type Server as HttpServer } from "http";
import { Server } from "socket.io";
import { auth } from "../lib/auth.ts";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../db/db.ts";
import { ChatParticipantTable, ChatTable, MessageTable } from "../db/schema.ts";
import { and, eq, isNull, ne } from "drizzle-orm";
import type { User } from "better-auth";

const typingUsersByChat = new Map<string, Set<string>>();
const activeUserCounts = new Map<string, number>();

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL!,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(socket.handshake.headers),
      });

      if (!session?.user) {
        return next(new Error("Unauthorized"));
      }

      socket.data.userId = session.user.id;

      next();
    } catch (error: any) {
      next(new Error(error));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const currentCount = activeUserCounts.get(userId) ?? 0;
    activeUserCounts.set(userId, currentCount + 1);
    socket.join(`user:${userId}`);

    if (currentCount === 0) {
      io.emit("user-active", { userId });
    }

    socket.emit("active-users", {
      userIds: Array.from(activeUserCounts.keys()),
    });

    socket.on("join-chat", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("create-chat", (participantId: string) => {
      socket
        .to(`user:${participantId}`)
        .to(`user:${userId}`)
        .emit("chat-created");
      socket
        .to(`user:${participantId}`)
        .to(`user:${userId}`)
        .emit("active-users", {
          userIds: Array.from(activeUserCounts.keys()),
        });
    });

    socket.on(
      "send-message",
      async (data: { chatId: string; message: string }) => {
        const userId = socket.data.userId;
        const { chatId, message } = data;
        const [existingChat] = await db
          .select()
          .from(ChatTable)
          .where(eq(ChatTable.id, chatId));

        if (!existingChat) {
          socket.emit("socket-error", { message: "Chat doesn't exist" });
          return;
        }

        const [createdMessage] = await db
          .insert(MessageTable)
          .values({
            chatId,
            message,
            sender: userId,
          })
          .returning();

        if (!createdMessage) {
          socket.emit("socket-error", { message: "Failed to create message" });
          return;
        }

        const room = io.sockets.adapter.rooms.get(`chat:${chatId}`);
        let shouldMarkRead = false;

        if (room) {
          for (const socketId of room) {
            const roomSocket = io.sockets.sockets.get(socketId);
            if (roomSocket?.data.userId && roomSocket.data.userId !== userId) {
              shouldMarkRead = true;
              break;
            }
          }
        }

        if (shouldMarkRead) {
          await db
            .update(MessageTable)
            .set({ readAt: new Date() })
            .where(eq(MessageTable.id, createdMessage.id));
        } else {
          const participants = await db
            .select({ userId: ChatParticipantTable.userId })
            .from(ChatParticipantTable)
            .where(
              and(
                eq(ChatParticipantTable.chatId, chatId),
                ne(ChatParticipantTable.userId, userId),
              ),
            );

          for (const participant of participants) {
            io.to(`user:${participant.userId}`).emit("chat-unread", {
              chatId,
              unreadCount: 1,
            });
          }
        }

        const createdMessageWithUser = await db.query.MessageTable.findFirst({
          where: eq(MessageTable.id, createdMessage.id),
          with: {
            user: true,
          },
        });

        if (!createdMessageWithUser) {
          socket.emit("socket-error", { message: "Failed to create message" });
          return;
        }

        socket
          .to(`chat:${chatId}`)
          .emit("chat-message", createdMessageWithUser);
      },
    );

    socket.on(
      "typing-indicator",
      (data: { chatId: string; user: User | undefined }) => {
        if (!data.user) {
          socket.emit("socket-error", { message: "No user found" });
          return;
        }
        const usersForChat =
          typingUsersByChat.get(data.chatId) ?? new Set<string>();
        if (usersForChat.has(data.user.id)) return;
        usersForChat.add(data.user.id);
        typingUsersByChat.set(data.chatId, usersForChat);
        socket.to(`chat:${data.chatId}`).emit("typing-message", data.user);
      },
    );

    socket.on(
      "stopped-typing",
      (data: { chatId: string; user: User | undefined }) => {
        if (!data.user) {
          socket.emit("socket-error", { message: "No user found" });
          return;
        }
        const usersForChat = typingUsersByChat.get(data.chatId);
        if (usersForChat) {
          usersForChat.delete(data.user.id);
          if (usersForChat.size === 0) {
            typingUsersByChat.delete(data.chatId);
          }
        }
        socket.to(`chat:${data.chatId}`).emit("stopped-typing", data.user);
      },
    );

    socket.on("mark-read", async (data: { chatId: string }) => {
      const { chatId } = data;
      if (!chatId) return;
      await db
        .update(MessageTable)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(MessageTable.chatId, chatId),
            ne(MessageTable.sender, userId),
            isNull(MessageTable.readAt),
          ),
        );

      io.to(`user:${userId}`).emit("chat-read", { chatId });
    });

    socket.on("disconnect", () => {
      for (const [chatId, usersForChat] of typingUsersByChat.entries()) {
        if (usersForChat.has(userId)) {
          usersForChat.delete(userId);
          socket.to(`chat:${chatId}`).emit("stopped-typing", { id: userId });
        }
        if (usersForChat.size === 0) {
          typingUsersByChat.delete(chatId);
        }
      }

      const nextCount = (activeUserCounts.get(userId) ?? 1) - 1;
      if (nextCount <= 0) {
        activeUserCounts.delete(userId);
        io.emit("user-inactive", { userId });
      } else {
        activeUserCounts.set(userId, nextCount);
      }
    });
  });

  return io;
};
