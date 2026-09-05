"use client";

import { useState } from "react";
import type { Script, ScriptCategory } from "@/types/scripts";
import { SCRIPT_CATEGORIES } from "@/types/scripts";
import { useScriptsQuery, useSetScriptActive } from "@/lib/api/scripts";
import { Card } from "@/components/ui/card/Card";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Select } from "@/components/ui/select/Select";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { SCRIPT_CATEGORY_LABEL } from "@/lib/format/labels";
import { ScriptFormModal } from "./ScriptFormModal";
import { RenderScriptModal } from "./RenderScriptModal";
import styles from "./scripts.module.css";

const PREVIEW_LENGTH = 160;

type FormModalTarget = "create" | Script;

interface ScriptsViewProps {
  initialScripts: Script[];
}

function truncate(content: string): string {
  return content.length > PREVIEW_LENGTH ? `${content.slice(0, PREVIEW_LENGTH)}…` : content;
}

export function ScriptsView({ initialScripts }: ScriptsViewProps) {
  const { showToast } = useToast();
  const [category, setCategory] = useState<ScriptCategory | "">("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formModalTarget, setFormModalTarget] = useState<FormModalTarget | null>(null);
  const [renderTarget, setRenderTarget] = useState<Script | null>(null);

  const isDefaultQuery = !category && !includeInactive;
  const scriptsQuery = useScriptsQuery(
    { category: category || undefined, includeInactive: includeInactive || undefined },
    { initialData: isDefaultQuery ? initialScripts : undefined },
  );

  const setActive = useSetScriptActive();

  function handleToggleActive(script: Script) {
    const nextActive = !script.isActive;
    setActive.mutate(
      { id: script.id, active: nextActive },
      {
        onSuccess: () => showToast(nextActive ? "Скрипт активирован" : "Скрипт деактивирован", "success"),
        onError: (mutationError) => {
          showToast(mutationError instanceof Error ? mutationError.message : "Не удалось изменить статус скрипта.", "error");
        },
      },
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Скрипты продаж</h1>
        <Button type="button" onClick={() => setFormModalTarget("create")}>
          + Скрипт
        </Button>
      </div>

      <Card>
        <div className={styles.filters}>
          <Select
            value={category}
            onChange={(event) => setCategory(event.target.value as ScriptCategory | "")}
            aria-label="Фильтр по категории"
          >
            <option value="">Все категории</option>
            {SCRIPT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {SCRIPT_CATEGORY_LABEL[value]}
              </option>
            ))}
          </Select>

          <Checkbox
            id="scripts-include-inactive"
            className={styles.filterCheckbox}
            label="Показать неактивные"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
        </div>

        {scriptsQuery.isPending ? (
          <Spinner />
        ) : scriptsQuery.isError ? (
          <StateMessage tone="error" title="Не удалось загрузить скрипты" description={scriptsQuery.error.message} />
        ) : scriptsQuery.data.length === 0 ? (
          <StateMessage title="Скрипты не найдены" description="Попробуйте изменить фильтры или создайте новый скрипт." />
        ) : (
          <div className={styles.grid}>
            {scriptsQuery.data.map((script) => (
              <Card key={script.id} className={styles.scriptCard}>
                <div className={styles.cardTop}>
                  <span className={styles.cardTitle}>{script.title}</span>
                </div>
                <div className={styles.badges}>
                  <Badge tone="neutral">{SCRIPT_CATEGORY_LABEL[script.category]}</Badge>
                  <Badge tone={script.isActive ? "success" : "neutral"}>
                    {script.isActive ? "Активен" : "Неактивен"}
                  </Badge>
                </div>
                <p className={styles.preview}>{truncate(script.content)}</p>
                <div className={styles.actions}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setFormModalTarget(script)}>
                    Редактировать
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={setActive.isPending && setActive.variables?.id === script.id}
                    onClick={() => handleToggleActive(script)}
                  >
                    {script.isActive ? "Деактивировать" : "Активировать"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRenderTarget(script)}>
                    Просмотр с подстановкой
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {formModalTarget ? (
        <ScriptFormModal
          key={formModalTarget === "create" ? "create" : formModalTarget.id}
          script={formModalTarget === "create" ? undefined : formModalTarget}
          onClose={() => setFormModalTarget(null)}
        />
      ) : null}

      {renderTarget ? (
        <RenderScriptModal
          key={renderTarget.id}
          scriptId={renderTarget.id}
          scriptTitle={renderTarget.title}
          scriptContent={renderTarget.content}
          onClose={() => setRenderTarget(null)}
        />
      ) : null}
    </div>
  );
}
