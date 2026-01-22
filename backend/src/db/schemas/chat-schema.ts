import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { MessageTable } from "./message-schema.ts";
import { ChatParticipantTable } from "./chat-participant-schema.ts";

export const ChatTable = pgTable("chats", {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const chatRelations = relations(ChatTable, ({ many }) => ({
  messages: many(MessageTable),
  participants: many(ChatParticipantTable),
}));
