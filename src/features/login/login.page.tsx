import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/shared/ui/kit/field";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/shared/api/login";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/model/routes";
import { useAuth } from "@/shared/lib/use-auth";

const loginSchema = z.object({
  idInstance: z.string(),
  apiTokenInstance: z.string(),
});

type loginSchemaType = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const loginForm = useForm<loginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      idInstance: "",
      apiTokenInstance: "",
    },
  });

  const navigate = useNavigate();
  const { setCredentials } = useAuth();

  const loginMutation = useMutation({
    mutationFn: (data: loginSchemaType) =>
      login.getInstance(data.idInstance, data.apiTokenInstance),
  });

  const onSubmit = loginForm.handleSubmit(async (data) => {
    loginForm.clearErrors("root");

    try {
      const result = await loginMutation.mutateAsync(data);

      if (result.stateInstance !== "authorized") {
        loginForm.setError("root", {
          message: `Инстанс не готов: ${result.stateInstance}`,
        });
        return;
      }

      setCredentials(data);
      navigate(ROUTES.CHAT);
    } catch (error) {
      loginForm.setError("root", {
        message:
          error instanceof Error ? error.message : "Не удалось подключиться",
      });
    }
  });

  return (
    <div className="min-w-125 m-auto">
      <div className="flex flex-col gap-2 mb-6">
        <h1>Введите данные вашего инстанса GREEN-API</h1>
      </div>
      <form onSubmit={onSubmit}>
        <FieldSet>
          <FieldGroup>
            <Controller
              name="idInstance"
              control={loginForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>idInstance</FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    placeholder="idInstance"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="apiTokenInstance"
              control={loginForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>apiTokenInstance</FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    autoComplete="off"
                    placeholder="apiTokenInstance"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {loginForm.formState.errors.root && (
            <p className="text-red-500">
              {loginForm.formState.errors.root.message}
            </p>
          )}

          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Подключение…" : "Подключиться"}
          </Button>
        </FieldSet>
      </form>
    </div>
  );
};

export const Component = LoginPage;
