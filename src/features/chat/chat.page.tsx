import { chat } from "@/shared/api/chat";
import { useAuth } from "@/shared/lib/use-auth";
import { Button } from "@/shared/ui/kit/button";
import { Field, FieldLabel, FieldSet } from "@/shared/ui/kit/field";
import { Input } from "@/shared/ui/kit/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  });

  const [chats, setChats] = useState<Phone[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const onChatSubmit = chatForm.handleSubmit(async (data) => {
    chatForm.reset();

    if (
      credentials?.apiTokenInstance &&
      credentials?.idInstance &&
      selectedPhone
    ) {
      console.log(credentials);
      await sendMessageMutation.mutateAsync({
        idInstance: credentials.idInstance,
        apiTokenInstance: credentials.apiTokenInstance,
        chatId: `${selectedPhone}@c.us`,
        message: data.message,
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

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="flex-1 grid border border-border bg-background grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col border-r border-b-0">
          <div className="border-b border-border p-6">
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

          <div className="flex flex-1 p-6">
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

        <div className="flex min-h-96 min-w-0 flex-col">
          <header className="border-b border-border p-6">
            {selectedPhone ? (
              <h2 className="text-lg font-medium">+{selectedPhone}</h2>
            ) : (
              <h2 className="text-lg font-medium">Чат не выбран</h2>
            )}
          </header>

          <div className="flex flex-1 items-center justify-center bg-muted/30 p-6">
            {selectedPhone ? (
              ""
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Создайте или выберите чат
              </p>
            )}
          </div>

          <form className="border-t border-border p-4" onSubmit={onChatSubmit}>
            <Field>
              <FieldLabel className="sr-only">Сообщение</FieldLabel>

              <div className="flex gap-3 flex-row">
                <Input
                  {...chatForm.register("message")}
                  placeholder="Сообщение"
                  disabled={!selectedPhone}
                  autoComplete="off"
                />
                <Button type="submit" disabled={!selectedPhone}>
                  Отправить
                </Button>
              </div>
            </Field>
          </form>
        </div>
      </div>
    </div>
  );
};

export const Component = ChatPage;
