import { chat } from "@/shared/api/chat";
import { useAuth } from "@/shared/lib/use-auth";
import { useMutation } from "@tanstack/react-query";
import type { Message } from "../domain/message";

export const useSendMessage = () => {
  const { credentials } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({
      phone,
      text,
    }: {
      phone: string;
      text: string;
    }): Promise<Message> => {
      if (!credentials) {
        throw new Error("Нет учётных данных");
      }

      const trimmedText = text.trim();

      if (!trimmedText) {
        throw new Error("Введите сообщение");
      }

      const response = await chat.sendMessage({
        idInstance: credentials.idInstance,
        apiTokenInstance: credentials.apiTokenInstance,
        chatId: `${phone}@c.us`,
        message: trimmedText,
      });

      return {
        id: response.idMessage,
        phone,
        text: trimmedText,
        direction: "outgoing",
        createdAt: Date.now(),
      };
    },
    retry: false,
  });

  return {
    sendMessage: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
};
