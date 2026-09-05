import { forwardRef, type SelectHTMLAttributes } from "react";
import inputStyles from "../input/Input.module.css";
import styles from "./Select.module.css";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className={styles.wrapper}>
      <select
        ref={ref}
        className={[inputStyles.control, styles.select, className].filter(Boolean).join(" ")}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
});
