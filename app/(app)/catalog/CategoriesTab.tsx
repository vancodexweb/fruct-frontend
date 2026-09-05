"use client";

import { useState, type FormEvent } from "react";
import type { Category } from "@/types/catalog";
import { useCategoriesQuery, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/lib/api/catalog";
import { useSession } from "@/lib/session/SessionContext";
import { Card } from "@/components/ui/card/Card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Button } from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal/Modal";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import formStyles from "../form.module.css";
import styles from "./catalog.module.css";

interface CategoriesTabProps {
  initialCategories: Category[];
}

type ModalState = { mode: "create" } | { mode: "edit"; category: Category };

export function CategoriesTab({ initialCategories }: CategoriesTabProps) {
  const session = useSession();
  const isOwner = session.role === "OWNER";
  const categoriesQuery = useCategoriesQuery({ initialData: initialCategories });

  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const columns: TableColumn<Category>[] = [
    { key: "name", header: "Название", render: (category) => category.name },
    ...(isOwner
      ? ([
          {
            key: "actions",
            header: "",
            align: "right",
            render: (category: Category) => (
              <div className={styles.rowActions}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalState({ mode: "edit", category })}
                >
                  Редактировать
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={() => setDeleteTarget(category)}>
                  Удалить
                </Button>
              </div>
            ),
          },
        ] satisfies TableColumn<Category>[])
      : []),
  ];

  return (
    <Card>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Категории</h2>
        {isOwner ? (
          <Button type="button" onClick={() => setModalState({ mode: "create" })}>
            + Категория
          </Button>
        ) : null}
      </div>

      {categoriesQuery.isPending ? (
        <Spinner />
      ) : categoriesQuery.isError ? (
        <StateMessage
          tone="error"
          title="Не удалось загрузить категории"
          description={categoriesQuery.error.message}
        />
      ) : categoriesQuery.data.length === 0 ? (
        <StateMessage
          title="Категорий пока нет"
          description={isOwner ? "Добавьте первую категорию товаров." : undefined}
        />
      ) : (
        <Table columns={columns} rows={categoriesQuery.data} rowKey={(category) => category.id} />
      )}

      {modalState ? <CategoryFormModal state={modalState} onClose={() => setModalState(null)} /> : null}

      <DeleteCategoryModal category={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </Card>
  );
}

function CategoryFormModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  const { showToast } = useToast();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEdit = state.mode === "edit";
  const [name, setName] = useState(isEdit ? state.category.name : "");
  const [error, setError] = useState<string | null>(null);

  const pending = createCategory.isPending || updateCategory.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Введите название категории.");
      return;
    }

    if (isEdit) {
      updateCategory.mutate(
        { id: state.category.id, dto: { name: trimmed } },
        {
          onSuccess: () => {
            showToast("Категория обновлена", "success");
            onClose();
          },
          onError: (mutationError) => {
            setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить категорию.");
          },
        },
      );
    } else {
      createCategory.mutate(
        { name: trimmed },
        {
          onSuccess: () => {
            showToast("Категория создана", "success");
            onClose();
          },
          onError: (mutationError) => {
            setError(mutationError instanceof Error ? mutationError.message : "Не удалось создать категорию.");
          },
        },
      );
    }
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>
        Отмена
      </Button>
      <Button type="submit" form="category-form" loading={pending}>
        {isEdit ? "Сохранить" : "Создать"}
      </Button>
    </>
  );

  return (
    <Modal open onClose={onClose} title={isEdit ? "Редактировать категорию" : "Новая категория"} size="sm" footer={footer}>
      <form className={formStyles.form} id="category-form" onSubmit={handleSubmit}>
        <Field label="Название" required>
          {(fieldProps) => <Input {...fieldProps} autoFocus value={name} onChange={(e) => setName(e.target.value)} />}
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

function DeleteCategoryModal({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const { showToast } = useToast();
  const deleteCategory = useDeleteCategory();
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setError(null);
    deleteCategory.reset();
    onClose();
  }

  function handleDelete() {
    if (!category) return;
    setError(null);
    deleteCategory.mutate(category.id, {
      onSuccess: () => {
        showToast("Категория удалена", "success");
        handleClose();
      },
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось удалить категорию.");
      },
    });
  }

  return (
    <Modal
      open={Boolean(category)}
      onClose={handleClose}
      title="Удалить категорию?"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} loading={deleteCategory.isPending}>
            Удалить
          </Button>
        </>
      }
    >
      <p>
        Категория «{category?.name}» будет удалена. Товары, которые в ней состоят, просто останутся без категории — это
        не заблокирует удаление.
      </p>
      {error ? (
        <p role="alert" className={formStyles.error}>
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
