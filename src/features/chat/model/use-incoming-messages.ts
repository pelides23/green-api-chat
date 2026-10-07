import { chat } from "@/shared/api/chat";
import { useAuth } from "@/shared/lib/use-auth";
import { useEffect } from "react";

import { parseIncomingMessage, type Message } from "../domain/message";

type UseIncomingMessagesParams = {
  onMessage: (message: Message) => void;
};

export const useIncomingMessages = ({
  onMessage,
}: UseIncomingMessagesParams) => {
  const { credentials } = useAuth();

  const idInstance = credentials?.idInstance;
  const apiTokenInstance = credentials?.apiTokenInstance;

  useEffect(() => {
    if (!idInstance || !apiTokenInstance) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const receiveMessages = async () => {
      while (!signal.aborted) {
        try {
          const notification = await chat.receiveNotification({
            idInstance,
            apiTokenInstance,
            signal,
          });

          if (!notification) {
            await new Promise<void>((resolve) => {
              setTimeout(resolve, 1000);
            });

            continue;
          }

          if (signal.aborted) {
            return;
          }

          if (!notification) {
            continue;
          }

          const message = parseIncomingMessage(notification.body);

          if (message) {
            onMessage(message);
          }

          await chat.deleteNotification({
            idInstance,
            apiTokenInstance,
            receiptId: notification.receiptId,
            signal,
          });
        } catch (error) {
          if (signal.aborted) {
            return;
          }

          console.error("Ошибка получения уведомлений:", error);

          await new Promise<void>((resolve) => {
            setTimeout(resolve, 2000);
          });
        }
      }
    };

    void receiveMessages();

    return () => {
      controller.abort();
    };
  }, [idInstance, apiTokenInstance, onMessage]);
};
