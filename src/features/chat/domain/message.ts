import { z } from "zod";

const incomingTextSchema = z.object({
  typeWebhook: z.enum(["incomingMessageReceived", "outgoingMessageReceived"]),
  idMessage: z.string(),
  timestamp: z.number(),
  senderData: z.object({
    chatId: z.string(),
  }),
  messageData: z.object({
    typeMessage: z.literal("textMessage"),
    textMessageData: z.object({
      textMessage: z.string(),
    }),
  }),
});

export type Message = {
  id: string;
  phone: string;
  text: string;
  direction: "incoming" | "outgoing";
  createdAt: number;
};

export const parseIncomingMessage = (body: unknown): Message | null => {
  const result = incomingTextSchema.safeParse(body);

  if (!result.success) {
    return null;
  }

  const data = result.data;
  const chatId = data.senderData.chatId;

  if (!chatId.endsWith("@c.us")) {
    return null;
  }

  return {
    id: data.idMessage,
    phone: chatId.replace(/@c\.us$/, ""),
    text: data.messageData.textMessageData.textMessage,
    direction:
      data.typeWebhook === "incomingMessageReceived" ? "incoming" : "outgoing",
    createdAt: data.timestamp * 1000,
  };
};
