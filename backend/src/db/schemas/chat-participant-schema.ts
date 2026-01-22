import { pgTable, primaryKey, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { ChatTable } from "./chat-schema.ts";
import { user } from "./auth-schema.ts";
import { relations } from "drizzle-orm";

export const ChatParticipantTable = pgTable(
  "chatParticipants",
  {
    chatId: uuid()
      .references(() => ChatTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: varchar()
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({
      columns: [t.chatId, t.userId],
    }),
  ],
);

export const chatParticipantRelations = relations(
  ChatParticipantTable,
  ({ one }) => ({
    chat: one(ChatTable, {
      fields: [ChatParticipantTable.chatId],
      references: [ChatTable.id],
    }),
    user: one(user, {
      fields: [ChatParticipantTable.userId],
      references: [user.id],
    }),
  }),
);
