import type { KeyboardEvent, ReactNode } from "react";
import styles from "./Table.module.css";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({ columns, rows, rowKey, onRowClick }: TableProps<T>) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (onRowClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onRowClick(row);
    }
  }

  return (
    <div className={`scrollX ${styles.wrapper}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ width: column.width, textAlign: column.align ?? "left" }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? styles.clickable : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (event) => handleKeyDown(event, row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "button" : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align ?? "left" }}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
