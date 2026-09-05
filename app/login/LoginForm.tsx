"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/lib/api/auth";
import { Button } from "@/components/ui/button/Button";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import styles from "./login.module.css";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Укажите email и пароль.");
      return;
    }

    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          router.push(next);
          router.refresh();
        },
        onError: (error) => {
          setFormError(error instanceof Error ? error.message : "Не удалось войти.");
        },
      },
    );
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>Fruct CRM</h1>
        <p className={styles.subtitle}>
          CRM для продавца компьютерных кресел. Публичной регистрации нет — войдите с данными, которые
          выдал владелец магазина.
        </p>

        <Field label="Email" required>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="owner@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          )}
        </Field>

        <Field label="Пароль" required>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          )}
        </Field>

        {formError ? (
          <p className={styles.error} role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" loading={login.isPending} className={styles.submit}>
          Войти
        </Button>
      </form>
    </div>
  );
}
