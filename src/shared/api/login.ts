export const login = {
  getInstance: async (idInstance: string, apiTokenInstance: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(`Не удалось проверить подключение ${response.status}`);
    }

    return response.json();
  },
};
