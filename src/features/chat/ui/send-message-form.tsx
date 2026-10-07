import { Button } from "@/shared/ui/kit/button";
import { Field, FieldLabel } from "@/shared/ui/kit/field";
import { Input } from "@/shared/ui/kit/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().trim().min(1, "Введите сообщение"),
});

type ChatFormType = z.infer<typeof chatSchema>;

type SendMessageFormProps = {
  selectedPhone: string | null;
  isPending: boolean;
  onSendMessage: (phone: string, text: string) => Promise<void>;
  onSubmittingChange: (isSubmitting: boolean) => void;
};

export const SendMessageForm = ({
  selectedPhone,
  isPending,
  onSendMessage,
  onSubmittingChange,
}: SendMessageFormProps) => {
  const chatForm = useForm<ChatFormType>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      message: "",
    },
  });

  const { isSubmitting } = chatForm.formState;

  useEffect(() => {
    onSubmittingChange(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const onSubmit = chatForm.handleSubmit(async (data) => {
    if (!selectedPhone || isPending) {
      return;
    }

    const phone = selectedPhone;
    const text = data.message.trim();

    if (!text) return;

    chatForm.clearErrors("root");

    try {
      await onSendMessage(phone, text);

      chatForm.reset();
    } catch {
      chatForm.setError("root", {
        message: "Не удалось отправить сообщение",
      });
    }
  });

  return (
    <form className="shrink-0 border-t border-border p-4" onSubmit={onSubmit}>
      <Field>
        <FieldLabel className="sr-only">Сообщение</FieldLabel>

        <div className="flex gap-3 flex-row max-w-200 mx-auto">
          <Input
            {...chatForm.register("message")}
            placeholder="Сообщение"
            disabled={!selectedPhone || isSubmitting}
            autoComplete="off"
          />
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={!selectedPhone || isSubmitting}
          >
            {isSubmitting ? "Отправка…" : "Отправить"}
          </Button>
        </div>
        {chatForm.formState.errors.root && (
          <p className="mx-auto w-full max-w-200 text-sm text-destructive">
            {chatForm.formState.errors.root.message}
          </p>
        )}
      </Field>
    </form>
  );
};
