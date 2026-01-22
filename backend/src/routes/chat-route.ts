import express, { type Request, type Response } from "express";
import { authMiddleware } from "../middleware/middlewares.ts";
import { db } from "../db/db.ts";
import { ChatParticipantTable, ChatTable, MessageTable } from "../db/schema.ts";
import { asc, eq } from "drizzle-orm";

export const route = express.Router();
route.use(authMiddleware);

type CreateChatBody = {
  otherParticipantId: string;
};

route.post("/create-chat", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.json({ success: false, message: "Unauthorized" }).status(401);
  }

  const { otherParticipantId }: CreateChatBody = req.body;

  const [createdChat] = await db.insert(ChatTable).values({}).returning();
  if (!createdChat) {
    return res
      .json({ success: false, message: "Failed to create new chat" })
      .status(500);
  }

  await db.insert(ChatParticipantTable).values([
    { chatId: createdChat.id, userId: req.user.id },
    { chatId: createdChat.id, userId: otherParticipantId },
  ]);

  return res.json({
    success: true,
    message: "Chat created successfully!",
    chatId: createdChat.id,
  });
});

route.get("/get-messages/:chatId", async (req: Request, res: Response) => {
  const { chatId } = req.params;

  if (typeof chatId !== "string") {
    return res.json({ success: false, message: "Invalid params" }).status(400);
  }

  const messages = await db.query.MessageTable.findMany({
    where: eq(MessageTable.chatId, chatId),
    with: {
      user: true,
    },
    orderBy: [asc(MessageTable.createdAt), asc(MessageTable.id)],
  });

  return res.json({
    success: true,
    message: "Messages fetched successfully!",
    messages,
  });
});
