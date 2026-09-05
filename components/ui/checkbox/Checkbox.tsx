import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./Checkbox.module.css";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...rest },
  ref,
) {
  return (
    <label className={[styles.wrapper, className].filter(Boolean).join(" ")} htmlFor={id}>
      <input ref={ref} type="checkbox" id={id} className={styles.input} {...rest} />
      <span>{label}</span>
    </label>
  );
});
