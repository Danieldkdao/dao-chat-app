import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.ts";
import { relations } from "drizzle-orm";
import { ChatTable } from "./chat-schema.ts";

export const MessageTable = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  chatId: uuid()
    .references(() => ChatTable.id, { onDelete: "cascade" })
    .notNull(),
  sender: varchar()
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  message: varchar().notNull(),
  readAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const messageRelations = relations(MessageTable, ({ one }) => ({
  user: one(user, {
    fields: [MessageTable.sender],
    references: [user.id],
  }),
  chat: one(ChatTable, {
    fields: [MessageTable.chatId],
    references: [ChatTable.id],
  }),
}));
