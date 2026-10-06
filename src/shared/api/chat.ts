type SendMessageParams = {
  idInstance: string;
  apiTokenInstance: string;
  chatId: string;
  message: string;
};

type SendMessageResponse = {
  idMessage: string;
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
};
