import styles from "./Pagination.module.css";
import { Button } from "../button/Button";

interface PaginationProps {
  offset: number;
  limit: number;
  currentCount: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * List endpoints on the backend take limit/offset but never return a total
 * count, so a numbered page control would have to fabricate one — instead
 * this shows the visible range and infers "there may be more" from a full
 * page (currentCount === limit), same as most offset-paginated APIs do.
 */
export function Pagination({ offset, limit, currentCount, onPrev, onNext }: PaginationProps) {
  const hasPrev = offset > 0;
  const hasNext = currentCount === limit;
  const from = currentCount === 0 ? 0 : offset + 1;
  const to = offset + currentCount;

  return (
    <div className={styles.wrapper}>
      <span className={styles.info}>{currentCount === 0 ? "Нет записей" : `Показано ${from}–${to}`}</span>
      <div className={styles.controls}>
        <Button type="button" variant="secondary" size="sm" onClick={onPrev} disabled={!hasPrev}>
          Назад
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onNext} disabled={!hasNext}>
          Вперёд
        </Button>
      </div>
    </div>
  );
}
