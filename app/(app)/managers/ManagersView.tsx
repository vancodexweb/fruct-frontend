"use client";

import { useState } from "react";
import type { User } from "@/types/users";
import { useDeleteManager, useManagersQuery, useSetManagerBlocked } from "@/lib/api/users";
import { Card } from "@/components/ui/card/Card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal/Modal";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { formatCurrency, formatPercent } from "@/lib/format/number";
import { CreateManagerModal } from "./CreateManagerModal";
import { EditManagerModal } from "./EditManagerModal";
import formStyles from "../form.module.css";
import styles from "./managers.module.css";

interface ManagersViewProps {
  initialManagers: User[];
}

export function ManagersView({ initialManagers }: ManagersViewProps) {
  const { showToast } = useToast();
  const managersQuery = useManagersQuery({ initialData: initialManagers });
  const setBlocked = useSetManagerBlocked();
  const deleteManager = useDeleteManager();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [deletingManager, setDeletingManager] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleToggleBlocked(manager: User) {
    setBlocked.mutate(
      { id: manager.id, blocked: manager.isActive },
      {
        onSuccess: () => {
          showToast(manager.isActive ? "Менеджер заблокирован" : "Менеджер разблокирован", "success");
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : "Не удалось изменить статус менеджера.", "error");
        },
      },
    );
  }

  function handleDelete() {
    if (!deletingManager) return;
    setDeleteError(null);
    deleteManager.mutate(deletingManager.id, {
      onSuccess: () => {
        showToast("Менеджер удалён", "success");
        setDeletingManager(null);
      },
      onError: (error) => {
        setDeleteError(error instanceof Error ? error.message : "Не удалось удалить менеджера.");
      },
    });
  }

  const columns: TableColumn<User>[] = [
    { key: "fullName", header: "ФИО", render: (manager) => manager.fullName },
    { key: "email", header: "Email", render: (manager) => manager.email },
    {
      key: "status",
      header: "Статус",
      render: (manager) => (
        <>
          <Badge tone={manager.isActive ? "success" : "error"}>{manager.isActive ? "Активен" : "Заблокирован"}</Badge>
          {manager.mustChangePassword ? <span className={styles.mustChangeNote}>Требуется смена пароля</span> : null}
        </>
      ),
    },
    { key: "commissionPercent", header: "Комиссия", render: (manager) => formatPercent(manager.commissionPercent) },
    { key: "baseSalary", header: "Оклад", render: (manager) => formatCurrency(manager.baseSalary) },
    { key: "maxDiscountPercent", header: "Лимит скидки", render: (manager) => formatPercent(manager.maxDiscountPercent) },
    {
      key: "actions",
      header: "Действия",
      render: (manager) => (
        <div className={styles.actions}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditingManager(manager)}>
            Редактировать
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleToggleBlocked(manager)}
            loading={setBlocked.isPending && setBlocked.variables?.id === manager.id}
          >
            {manager.isActive ? "Заблокировать" : "Разблокировать"}
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={() => setDeletingManager(manager)}>
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Менеджеры</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          + Менеджер
        </Button>
      </div>

      <Card>
        {managersQuery.isPending ? (
          <Spinner />
        ) : managersQuery.isError ? (
          <StateMessage tone="error" title="Не удалось загрузить менеджеров" description={managersQuery.error.message} />
        ) : managersQuery.data.length === 0 ? (
          <StateMessage title="Менеджеры не найдены" description="Добавьте первого менеджера." />
        ) : (
          <Table columns={columns} rows={managersQuery.data} rowKey={(manager) => manager.id} />
        )}
      </Card>

      <CreateManagerModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditManagerModal manager={editingManager} onClose={() => setEditingManager(null)} />

      <Modal
        open={deletingManager !== null}
        onClose={() => setDeletingManager(null)}
        title="Удалить менеджера?"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setDeletingManager(null)}>
              Отмена
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} loading={deleteManager.isPending}>
              Удалить
            </Button>
          </>
        }
      >
        <p>Это мягкое удаление: менеджер будет деактивирован, а его email анонимизирован. Восстановить доступ будет нельзя.</p>
        {deleteError ? (
          <p role="alert" className={formStyles.error}>
            {deleteError}
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
