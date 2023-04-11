import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { ButtonLoader } from "./Loaders/ButtonLoader";
import styles from "./IconButton.module.css";

export type IconButtonProps = {
  /**
   * What are the button contents?
   */
  label: React.ReactNode;
  /**
   * Is this a round or message shape of the button?
   */
  variant?: "primary" | "secondary";
  /**
   * How large is this button?
   */
  size?: "small" | "large";
  /**
   * Should the button display a loading state?
   */
  isLoading?: boolean;
  /**
   * Should the button be disabled?
   */
  isDisabled?: boolean;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * What should the screen reader text show?
   */
  srText?: string;
  /**
   * What is the test id associated with this button?
   */
  testId?: string;
};

/**
 * Icon-only button component
 */
export const IconButton: React.FC<IconButtonProps> = ({
  label = <PlusCircleIcon width="24" color="white" />,
  variant = "primary",
  isLoading = false,
  isDisabled = false,
  size = "large",
  srText,
  onClick,
  testId,
}) => (
  <button
    data-testid={testId}
    type="button"
    onClick={onClick}
    disabled={isDisabled}
    className={`${styles.wrapper} ${styles[variant]} ${
      isDisabled ? styles.disabled : ""
    }`}
    aria-label={srText}>
    <div>
      {isLoading ? <ButtonLoader color="primary" size={size} /> : label}
    </div>
  </button>
);
