"use client";

import { useState, type FormEvent } from "react";
import type { CreateScriptDto, Script, ScriptCategory } from "@/types/scripts";
import { SCRIPT_CATEGORIES } from "@/types/scripts";
import { useCreateScript, useUpdateScript } from "@/lib/api/scripts";
import { Modal } from "@/components/ui/modal/Modal";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { Select } from "@/components/ui/select/Select";
import { Button } from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { SCRIPT_CATEGORY_LABEL } from "@/lib/format/labels";
import formStyles from "../form.module.css";

interface ScriptFormModalProps {
  onClose: () => void;
  /** When provided the modal edits this script; otherwise it creates a new one. */
  script?: Script;
}

const EMPTY_FORM = {
  category: "GREETING" as ScriptCategory,
  title: "",
  content: "",
};

function toFormState(script?: Script) {
  if (!script) return EMPTY_FORM;
  return { category: script.category, title: script.title, content: script.content };
}

export function ScriptFormModal({ onClose, script }: ScriptFormModalProps) {
  const { showToast } = useToast();
  const createScript = useCreateScript();
  const updateScript = useUpdateScript();
  const [form, setForm] = useState(() => toFormState(script));
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(script);
  const isPending = createScript.isPending || updateScript.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const dto: CreateScriptDto = {
      category: form.category,
      title: form.title.trim(),
      content: form.content,
    };

    const onSettled = {
      onSuccess: () => {
        showToast(isEditing ? "Скрипт обновлён" : "Скрипт создан", "success");
        onClose();
      },
      onError: (mutationError: unknown) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить скрипт.");
      },
    };

    if (script) {
      updateScript.mutate({ id: script.id, dto }, onSettled);
    } else {
      createScript.mutate(dto, onSettled);
    }
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>
        Отмена
      </Button>
      <Button type="submit" form="script-form" loading={isPending}>
        {isEditing ? "Сохранить" : "Создать скрипт"}
      </Button>
    </>
  );

  return (
    <Modal open onClose={onClose} title={isEditing ? "Редактировать скрипт" : "Новый скрипт"} size="md" footer={footer}>
      <form className={formStyles.form} onSubmit={handleSubmit} id="script-form">
        <div className={formStyles.grid2}>
          <Field label="Категория">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ScriptCategory })}
              >
                {SCRIPT_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {SCRIPT_CATEGORY_LABEL[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Заголовок" required>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            )}
          </Field>
        </div>

        <Field
          label="Текст скрипта"
          required
          hint="Плейсхолдеры: {{name}}, {{price}}, {{city}}, {{deliveryDays}} — незаполненный плейсхолдер останется в тексте как есть"
        >
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          )}
        </Field>

        {error ? (
          <p role="alert" className={formStyles.error}>
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
