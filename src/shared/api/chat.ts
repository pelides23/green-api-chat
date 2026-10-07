type SendMessageParams = {
  idInstance: string;
  apiTokenInstance: string;
  chatId: string;
  message: string;
};

type SendMessageResponse = {
  idMessage: string;
};

type ReceiveNotificationParams = {
  idInstance: string;
  apiTokenInstance: string;
  signal?: AbortSignal;
};

type NotificationResponse = {
  receiptId: number;
  body: {
    typeWebhook: string;
    [key: string]: unknown;
  };
};

export const chat = {
  sendMessage: async ({
    idInstance,
    apiTokenInstance,
    chatId,
    message,
  }: SendMessageParams): Promise<SendMessageResponse> => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId, message }),
      },
    );

    if (!res.ok) {
      throw new Error(`Не удалось отправить сообщение (${res.status})`);
    }

    return res.json();
  },

  receiveNotification: async ({
    idInstance,
    apiTokenInstance,
    signal,
  }: ReceiveNotificationParams): Promise<NotificationResponse | null> => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=5`,
      { signal },
    );

    if (!res.ok) {
      throw new Error(`Не удалось получить уведомление (${res.status})`);
    }

    const text = await res.text();

    return text.trim() ? JSON.parse(text) : null;
  },

  deleteNotification: async ({
    idInstance,
    apiTokenInstance,
    receiptId,
    signal,
  }: {
    idInstance: string;
    apiTokenInstance: string;
    receiptId: number;
    signal?: AbortSignal;
  }): Promise<void> => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`,
      {
        method: "DELETE",
        signal,
      },
    );

    if (!res.ok) {
      throw new Error(`Не удалось удалить уведомление (${res.status})`);
    }
  },
};
