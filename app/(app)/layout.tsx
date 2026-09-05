import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session.server";
import { SessionProvider } from "@/lib/session/SessionContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import styles from "./app-shell.module.css";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <SessionProvider user={user}>
      <div className={styles.shell}>
        <Sidebar role={user.role} />
        <div className={styles.main}>
          <Topbar />
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
