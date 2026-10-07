import { Button } from "@/shared/ui/kit/button";
import { Field, FieldLabel, FieldSet } from "@/shared/ui/kit/field";
import { Input } from "@/shared/ui/kit/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type Message } from "./domain/message";
import { useIncomingMessages } from "./model/use-incoming-messages";
import { useSendMessage } from "./model/use-send-message";
import { cn } from "@/shared/lib/css";

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

export const ChatPage = () => {
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

  const [chats, setChats] = useState<Phone[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const sendMessageMutation = useSendMessage();

  const selectedMessages = messages.filter(
    (message) => message.phone === selectedPhone,
  );

  const addMessage = useCallback((message: Message) => {
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
    if (!selectedPhone || sendMessageMutation.isPending) {
      return;
    }

    const phone = selectedPhone;
    const text = data.message.trim();

    if (!text) return;

    chatForm.clearErrors("root");

    try {
      const message = await sendMessageMutation.sendMessage({ phone, text });

      setMessages((prev) => [...prev, message]);

      chatForm.reset();
    } catch {
      chatForm.setError("root", {
        message: "Не удалось отправить сообщение",
      });
    }
  });

  const onCreateChatSubmit = phoneForm.handleSubmit((data) => {
    setSelectedPhone(data.phone);
    setChats((prev) => {
      const exists = prev.some((chat) => chat.phone === data.phone);

      return exists ? prev : [data, ...prev];
    });
    phoneForm.reset();
  });

  useIncomingMessages({
    onMessage: addMessage,
  });

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden">
      <div className="min-h-0 flex-1 grid border border-border bg-background grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 min-w-0 flex-col border-r border-b-0">
          <div className="shrink-0 border-b border-border p-6">
            <h1 className="mb-6 text-lg font-medium">Чаты</h1>

            <form onSubmit={onCreateChatSubmit}>
              <FieldSet>
                <Field>
                  <FieldLabel>Номер телефона</FieldLabel>
                  <Input
                    {...phoneForm.register("phone")}
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
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={chatForm.formState.isSubmitting}
                >
                  Создать чат
                </Button>
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
                    <Button
                      key={i}
                      className={cn(
                        "cursor-pointer rounded-md p-2 text-left disabled:opacity-50",
                        isSelected
                          ? "bg-primary"
                          : "bg-muted text-primary hover:bg-primary/10",
                      )}
                      onClick={() => setSelectedPhone(chat.phone)}
                    >
                      +{chat.phone}
                    </Button>
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

          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-6">
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
                      className={cn(
                        "flex",
                        isOutgoing ? "justify-end" : "justify-start",
                      )}
                    >
                      <p
                        className={cn(
                          "max-w-[75%] whitespace-pre-wrap wrap-break-word rounded-lg px-4 py-2",
                          isOutgoing
                            ? "bg-primary/10 text-foreground"
                            : "border border-border bg-background text-foreground",
                        )}
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
                  className="cursor-pointer"
                  disabled={!selectedPhone || chatForm.formState.isSubmitting}
                >
                  {chatForm.formState.isSubmitting ? "Отправка…" : "Отправить"}
                </Button>
              </div>
              {chatForm.formState.errors.root && (
                <p className="mx-auto w-full max-w-200 text-sm text-destructive">
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
