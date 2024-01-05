import styles from "./ShortCopySkeletonLoader.module.css";

export const ShortCopySkeletonLoader = ({ lines = 1 }) => (
  <div role="status" className={styles.wrapper}>
    {lines === 1 ? (
      <div className={`${styles.element} ${styles.element1Line}`} />
    ) : (
      <div className={styles.element2Lines}>
        <div className={styles.element} />
        <div className={styles.element} />
      </div>
    )}
  </div>
);
