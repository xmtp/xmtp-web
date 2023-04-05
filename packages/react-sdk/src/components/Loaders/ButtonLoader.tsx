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
  <div className={styles.btnLoaderWrapper}>
    <div
      className={`${styles.btnLoader} ${
        color === "primary" ? styles.btnLoaderLight : styles.btnLoaderDark
      } ${size === "small" ? styles.btnLoaderSmall : styles.btnLoaderLarge} ${
        styles.btnLoaderAnimate
      }`}
    />
  </div>
);
