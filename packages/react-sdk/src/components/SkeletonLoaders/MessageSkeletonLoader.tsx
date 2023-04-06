import styles from "./MessageSkeletonLoader.module.css";

export const MessageSkeletonLoader = ({ incoming = true }) => (
  <div role="status" className={styles.wrapper}>
    {incoming ? (
      <div className={styles.section}>
        <div className={`${styles.element} ${styles.elementSmall}`} />
        <div className={`${styles.element} ${styles.elementLarge}`} />
        <div className={`${styles.element} ${styles.elementMedium}`} />
        <div className={`${styles.element} ${styles.elementLast}`} />
      </div>
    ) : (
      <div className={`${styles.section} ${styles.sectionRight}`}>
        <div className={`${styles.element} ${styles.elementSmall}`} />
        <div className={`${styles.element} ${styles.elementLarge}`} />
        <div className={`${styles.element} ${styles.elementMedium}`} />
        <div className={`${styles.element} ${styles.elementLast}`} />
      </div>
    )}
  </div>
);
