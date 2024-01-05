import type { PropsWithChildren } from "react";
import styles from "./Button.module.css";

type ButtonProps = PropsWithChildren & {
  icon?: React.ReactNode;
  onClick?: React.DOMAttributes<HTMLButtonElement>["onClick"];
  secondary?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  icon,
  onClick,
  secondary,
}) => (
  <button
    className={`${styles.wrapper} ${secondary ? styles.secondary : ""}`}
    type="button"
    onClick={onClick}>
    {icon} {children}
  </button>
);
