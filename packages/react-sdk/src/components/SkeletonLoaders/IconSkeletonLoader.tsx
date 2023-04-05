import styles from "./IconSkeletonLoader.module.css";

export const IconSkeletonLoader = () => (
  <div role="status" className={styles.iconSkeletonLoaderWrapper}>
    <div className={styles.iconSkeletonLoader} />
  </div>
);
