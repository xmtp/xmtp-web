import Blockies from "react-18-blockies";
import styles from "./Avatar.module.css";

export type AvatarProps = {
  /**
   * Are we waiting on an avatar url?
   */
  isLoading?: boolean;
  /**
   * What, if any, avatar url is there?
   */
  url?: string;
  /**
   * What is the address associated with this avatar?
   */
  address?: string;
};

export const Avatar: React.FC<AvatarProps> = ({ url, isLoading, address }) => {
  if (isLoading) {
    return <div className={styles.loading} />;
  }

  if (url) {
    return <img className={styles.avatar} src={url} alt={address} />;
  }

  if (!address) {
    return <div className={styles.avatar} />;
  }

  return (
    <Blockies
      data-testid="avatar"
      seed={address || ""}
      scale={5}
      size={8}
      className={styles.blockies}
    />
  );
};
