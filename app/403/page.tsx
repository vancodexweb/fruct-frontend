import Link from "next/link";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import styles from "./forbidden.module.css";

export default function ForbiddenPage() {
  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <p className={styles.code}>403</p>
        <h1 className={styles.title}>Недостаточно прав</h1>
        <p className={styles.description}>
          Этот раздел доступен только владельцу магазина. Если вам нужен доступ, обратитесь к владельцу
          учётной записи.
        </p>
        <Link href="/">
          <Button type="button">На главную</Button>
        </Link>
      </Card>
    </div>
  );
}
