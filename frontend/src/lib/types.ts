export type Response<K = {}> = {
  success: boolean;
  message: string;
} & Partial<K>;

export type Message = {
  id: string;
  chatId: string;
  sender: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type Chat = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ChatParticipant = {
  chatId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
