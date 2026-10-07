import { Button } from "@/shared/ui/kit/button";
import { Field, FieldLabel, FieldSet } from "@/shared/ui/kit/field";
import { Input } from "@/shared/ui/kit/input";
import { zodResolver } from "@hookform/resolvers/zod";
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

type PhoneFormType = z.infer<typeof phoneSchema>;

type CreateChatFormProps = {
  onCreateChat: (phone: string) => void;
  disabled: boolean;
};

export const CreateChatForm = ({
  onCreateChat,
  disabled,
}: CreateChatFormProps) => {
  const phoneForm = useForm<PhoneFormType>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const onSubmit = phoneForm.handleSubmit((data) => {
    onCreateChat(data.phone);
    phoneForm.reset();
  });

  return (
    <form onSubmit={onSubmit}>
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
        <Button type="submit" className="cursor-pointer" disabled={disabled}>
          Создать чат
        </Button>
      </FieldSet>
    </form>
  );
};
