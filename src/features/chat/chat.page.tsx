import { chat } from "@/shared/api/chat";
import { useAuth } from "@/shared/lib/use-auth";
import { Button } from "@/shared/ui/kit/button";
import { Field, FieldLabel, FieldSet } from "@/shared/ui/kit/field";
import { Input } from "@/shared/ui/kit/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const incomingTextSchema = z.object({
  typeWebhook: z.literal("incomingMessageReceived"),
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

const parseIncomingMessage = (body: unknown): Message | null => {
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
    direction: "incoming",
    createdAt: data.timestamp * 1000,
  };
};

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Введите номер телефона")
    .regex(
      /^\+?[\d\s()-]+$/,
      "Допустимы только цифры, пробелы, скобки, дефисы и + в начале",
    )
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .regex(
          /^[1-9]\d{6,14}$/,
          "Введите номер с кодом страны: от 7 до 15 цифр",
        ),
    ),
});

type phoneFormType = z.infer<typeof phoneSchema>;

type Phone = {
  phone: string;
};

const chatSchema = z.object({
  message: z.string().trim().min(1, "Введите сообщение"),
});

type chatFormType = z.infer<typeof chatSchema>;

type Message = {
  id: string;
  phone: string;
  text: string;
  direction: "incoming" | "outgoing";
  createdAt: number;
};

export const ChatPage = () => {
  const { credentials } = useAuth();

  const phoneForm = useForm<phoneFormType>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const chatForm = useForm<chatFormType>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      message: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: chat.sendMessage,
    retry: false,
  });

  const [chats, setChats] = useState<Phone[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const selectedMessages = messages.filter(
    (message) => message.phone === selectedPhone,
  );

  useEffect(() => {
    isNearBottomRef.current = true;
    const container = messagesContainerRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [selectedPhone]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (container && isNearBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [selectedMessages.length]);

  const addIncomingMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const exists = prev.some((item) => item.id === message.id);

      return exists ? prev : [...prev, message];
    });

    setChats((prev) => {
      const exists = prev.some((item) => item.phone === message.phone);

      return exists ? prev : [...prev, { phone: message.phone }];
    });
  }, []);

  const onChatSubmit = chatForm.handleSubmit(async (data) => {
    if (!credentials || !selectedPhone || sendMessageMutation.isPending) {
      return;
    }

    const phone = selectedPhone;
    const text = data.message.trim();

    if (!text) return;

    chatForm.clearErrors("root");

    try {
      const res = await sendMessageMutation.mutateAsync({
        idInstance: credentials.idInstance,
        apiTokenInstance: credentials.apiTokenInstance,
        chatId: `${phone}@c.us`,
        message: text,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: res.idMessage,
          phone,
          text,
          direction: "outgoing",
          createdAt: Date.now(),
        },
      ]);

      chatForm.reset();
    } catch {
      chatForm.setError("root", {
        message: "Не удалось отправить сообщение",
      });
    }
  });

  const onSubmit = phoneForm.handleSubmit((data) => {
    setSelectedPhone(data.phone);
    setChats((prev) => {
      const exists = prev.some((chat) => chat.phone === data.phone);

      return exists ? prev : [...prev, data];
    });
    phoneForm.reset();
  });

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

          if (signal.aborted) {
            return;
          }

          if (!notification) {
            continue;
          }

          const message = parseIncomingMessage(notification.body);

          if (message) {
            addIncomingMessage(message);
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
  }, [idInstance, apiTokenInstance, addIncomingMessage]);

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden">
      <div className="min-h-0 flex-1 grid border border-border bg-background grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 min-w-0 flex-col border-r border-b-0">
          <div className="shrink-0 border-b border-border p-6">
            <h1 className="mb-6 text-lg font-medium">Чаты</h1>

            <form onSubmit={onSubmit}>
              <FieldSet>
                <Field>
                  <FieldLabel>Номер телефона</FieldLabel>
                  <Input
                    {...phoneForm.register("phone", {
                      required: "Введите номер телефона",
                      validate: (value) => {
                        if (!/^\+?[\d\s()-]+$/.test(value.trim())) {
                          return "Номер не должен содержать буквы";
                        }

                        const digits = value.replace(/\D/g, "");

                        return (
                          /^7\d{10}$/.test(digits) ||
                          "Введите номер в формате +7 (999) 999-99-99"
                        );
                      },
                    })}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+7 (999) 999-99-99"
                  />
                </Field>

                {phoneForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
                <Button type="submit">Создать чат</Button>
              </FieldSet>
            </form>
          </div>

          <div className="flex min-h-0 flex-1 overflow-y-auto p-6">
            {chats.length === 0 && (
              <p className=" flex-1 my-auto text-center text-sm text-muted-foreground">
                Нет созданных чатов
              </p>
            )}
            {chats.length > 0 && (
              <div className="flex flex-col gap-2 w-full">
                {chats.map((chat, i) => {
                  const isSelected = selectedPhone === chat.phone;
                  return (
                    <div
                      key={i}
                      className={`cursor-pointer rounded-md p-2 ${
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-primary/5"
                      }`}
                      onClick={() => setSelectedPhone(chat.phone)}
                    >
                      +{chat.phone}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="shrink-0 border-b border-border p-6">
            {selectedPhone ? (
              <h2 className="text-lg font-medium">+{selectedPhone}</h2>
            ) : (
              <h2 className="text-lg font-medium">Чат не выбран</h2>
            )}
          </header>

          <div
            ref={messagesContainerRef}
            className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-6"
            onScroll={(event) => {
              const { scrollHeight, scrollTop, clientHeight } =
                event.currentTarget;
              isNearBottomRef.current =
                scrollHeight - scrollTop - clientHeight < 80;
            }}
          >
            <div className="mx-auto flex min-h-full w-full max-w-200 flex-col gap-3">
              {!selectedPhone ? (
                <p className="my-auto text-center text-sm text-muted-foreground">
                  Создайте или выберите чат
                </p>
              ) : selectedMessages.length === 0 ? (
                <p className="my-auto text-center text-sm text-muted-foreground">
                  Пока нет сообщений
                </p>
              ) : (
                selectedMessages.map((message) => {
                  const isOutgoing = message.direction === "outgoing";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOutgoing ? "justify-end" : "justify-start"
                      }`}
                    >
                      <p
                        className={`max-w-[75%] whitespace-pre-wrap wrap-break-word rounded-lg px-4 py-2 ${
                          isOutgoing
                            ? "bg-primary/10 text-foreground"
                            : "border border-border bg-background text-foreground"
                        }`}
                      >
                        {message.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <form
            className="shrink-0 border-t border-border p-4"
            onSubmit={onChatSubmit}
          >
            <Field>
              <FieldLabel className="sr-only">Сообщение</FieldLabel>

              <div className="flex gap-3 flex-row max-w-200 mx-auto">
                <Input
                  {...chatForm.register("message")}
                  placeholder="Сообщение"
                  disabled={!selectedPhone || chatForm.formState.isSubmitting}
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  disabled={!selectedPhone || chatForm.formState.isSubmitting}
                >
                  {chatForm.formState.isSubmitting ? "Отправка…" : "Отправить"}
                </Button>
              </div>
              {chatForm.formState.errors.root && (
                <p
                  role="alert"
                  className="mx-auto w-full max-w-200 text-sm text-destructive"
                >
                  {chatForm.formState.errors.root.message}
                </p>
              )}
            </Field>
          </form>
        </div>
      </div>
    </div>
  );
};

export const Component = ChatPage;
