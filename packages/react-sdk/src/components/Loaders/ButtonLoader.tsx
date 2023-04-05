import styles from "./ButtonLoader.module.css";

export type ButtonLoaderProps = {
  /**
   * What color should the loader/spinner be?
   */
  color?: "primary" | "secondary";
  /**
   * How large is this button?
   */
  size?: "small" | "large";
};

/**
 * Primary UI component for user interaction
 */
export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  size,
  color = "primary",
}) => (
  <div className={styles.wrapper}>
    <div
      className={`${styles.element} ${
        color === "primary" ? styles.light : styles.dark
      } ${size === "small" ? styles.elementSmall : styles.elementLarge}`}
    />
  </div>
);
