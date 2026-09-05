import { forwardRef, type TextareaHTMLAttributes } from "react";
import inputStyles from "../input/Input.module.css";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={[inputStyles.control, className].filter(Boolean).join(" ")}
        {...rest}
      />
    );
  },
);
