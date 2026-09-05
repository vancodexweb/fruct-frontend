import styles from "./Spinner.module.css";

export function Spinner({ label = "Загрузка…" }: { label?: string }) {
  return (
    <span className={styles.wrapper} role="status">
      <span className={styles.circle} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
