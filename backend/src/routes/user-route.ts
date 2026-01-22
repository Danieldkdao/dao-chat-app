import express, { type Request, type Response } from "express";
import { db } from "../db/db.ts";
import { user } from "../db/schemas/auth-schema.ts";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/middlewares.ts";
import { ChatParticipantTable, MessageTable } from "../db/schema.ts";

export const route = express.Router();
route.use(authMiddleware);

route.get("/get-users", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.json({ success: false, message: "Unauthorized" }).status(401);
  }

  const users = await db
    .select()
    .from(user)
    .where(
      and(
        ne(user.id, req.user.id),
        sql`NOT EXISTS (
        SELECT 1 FROM ${ChatParticipantTable} cp1
        INNER JOIN ${ChatParticipantTable} cp2
          ON cp1."chatId" = cp2."chatId"
        WHERE cp1."userId" = ${req.user.id}
          AND cp2."userId" = ${user.id}
      )`,
      ),
    );

  return res
    .json({
      success: true,
      message: "Users fetched successfully!",
      users,
    })
    .status(200);
});

route.get("/get-user-chats", async (req: Request, res: Response) => {
  if (!req.user) {
    throw new Error("Unauthorized");
  }

  const userChats = await db.query.ChatParticipantTable.findMany({
    where: eq(ChatParticipantTable.userId, req.user.id),
    with: {
      chat: {
        with: {
          participants: {
            where: ne(ChatParticipantTable.userId, req.user.id),
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  const chatIds = userChats.map((chat) => chat.chatId);
  const unreadCounts =
    chatIds.length === 0
      ? []
      : await db
          .select({
            chatId: MessageTable.chatId,
            count: sql<number>`count(*)`,
          })
          .from(MessageTable)
          .where(
            and(
              inArray(MessageTable.chatId, chatIds),
              ne(MessageTable.sender, req.user.id),
              sql`${MessageTable.readAt} IS NULL`,
            ),
          )
          .groupBy(MessageTable.chatId);

  const unreadCountsByChat = new Map(
    unreadCounts.map((entry) => [entry.chatId, Number(entry.count)]),
  );

  return res.json({
    success: true,
    message: "User chats fetched successfully!",
    userChats: userChats.map((userChat) => ({
      ...userChat,
      unreadCount: unreadCountsByChat.get(userChat.chatId) ?? 0,
    })),
  });
});
