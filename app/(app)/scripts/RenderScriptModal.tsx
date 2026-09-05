"use client";

import { useState, type FormEvent } from "react";
import type { RenderScriptDto } from "@/types/scripts";
import { useRenderScript } from "@/lib/api/scripts";
import { Modal } from "@/components/ui/modal/Modal";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import formStyles from "../form.module.css";
import styles from "./scripts.module.css";

interface RenderScriptModalProps {
  onClose: () => void;
  scriptId: string;
  scriptTitle: string;
  scriptContent: string;
}

const EMPTY_FORM = {
  name: "",
  price: "",
  city: "",
  deliveryDays: "",
};

export function RenderScriptModal({ onClose, scriptId, scriptTitle, scriptContent }: RenderScriptModalProps) {
  const renderScript = useRenderScript();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const dto: RenderScriptDto = {
      name: form.name.trim() || undefined,
      price: form.price.trim() ? Number(form.price) : undefined,
      city: form.city.trim() || undefined,
      deliveryDays: form.deliveryDays.trim() ? Number(form.deliveryDays) : undefined,
    };

    renderScript.mutate(
      { id: scriptId, dto },
      {
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : "Не удалось отрендерить скрипт.");
        },
      },
    );
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>
        Закрыть
      </Button>
      <Button type="submit" form="render-script-form" loading={renderScript.isPending}>
        Показать
      </Button>
    </>
  );

  return (
    <Modal open onClose={onClose} title={`Просмотр с подстановкой: ${scriptTitle}`} size="lg" footer={footer}>
      <div className={formStyles.form}>
        <div className={styles.previewBlock}>
          <span className={styles.previewLabel}>Исходный шаблон</span>
          <p className={styles.previewText}>{scriptContent}</p>
          <span className={styles.previewHint}>
            Незаполненный плейсхолдер останется в тексте как есть, например {"{{city}}"}.
          </span>
        </div>

        <form className={formStyles.form} onSubmit={handleSubmit} id="render-script-form">
          <div className={formStyles.grid2}>
            <Field label="Имя (name)">
              {(fieldProps) => (
                <Input {...fieldProps} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              )}
            </Field>
            <Field label="Цена (price)">
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              )}
            </Field>
          </div>
          <div className={formStyles.grid2}>
            <Field label="Город (city)">
              {(fieldProps) => (
                <Input {...fieldProps} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              )}
            </Field>
            <Field label="Срок доставки, дни (deliveryDays)">
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  value={form.deliveryDays}
                  onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
                />
              )}
            </Field>
          </div>

          {error ? (
            <p role="alert" className={formStyles.error}>
              {error}
            </p>
          ) : null}
        </form>

        {renderScript.isSuccess ? (
          <div className={styles.previewBlock}>
            <span className={styles.previewLabel}>Результат</span>
            <p className={styles.previewText}>{renderScript.data.rendered}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
