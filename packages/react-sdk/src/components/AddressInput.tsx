import {
  ChevronLeftIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { forwardRef, useCallback } from "react";
import { Avatar } from "./Avatar";
import { ShortCopySkeletonLoader } from "./SkeletonLoaders/ShortCopySkeletonLoader";
import styles from "./AddressInput.module.css";

export type AddressInputProps = {
  /**
   * What, if any, ARIA label should be used for the text input
   */
  ariaLabel?: string;
  /**
   * What, if any, resolved address is there?
   */
  resolvedAddress?: {
    displayAddress: string;
    walletAddress?: string;
  };
  /**
   * What, if any, subtext is there?
   */
  subtext?: string;
  /**
   * What are the props associated with the avatar?
   */
  avatarUrlProps?: {
    // What is the avatar url?
    avatarUrl?: string;
    // Is the avatar url loading?
    isLoading?: boolean;
    // What's the address of this wallet?
    address?: string;
  };
  /**
   * What, if any, label should be used?
   */
  label?: string;
  /**
   * What happens on a submit?
   */
  onChange?: (value: string) => void;
  /**
   * Upon submit, has there been an error?
   */
  isError?: boolean;
  /**
   * Upon submit, is something loading?
   */
  isLoading?: boolean;
  /**
   * Is there a tooltip click event that needs to be handled?
   */
  onTooltipClick?: () => void;
  /**
   * Input Value
   */
  value?: string;
  /**
   * Is there a left icon click event that needs to be handled?
   */
  onLeftIconClick?: () => void;
};

export const AddressInput = forwardRef<HTMLInputElement, AddressInputProps>(
  (
    {
      ariaLabel,
      resolvedAddress,
      subtext,
      avatarUrlProps,
      onChange,
      isError,
      isLoading,
      label,
      onLeftIconClick,
      onTooltipClick,
      value,
    },
    ref,
  ) => {
    const handleChange = useCallback<
      React.ChangeEventHandler<HTMLInputElement>
    >(
      (event) => {
        onChange?.(event.target.value);
      },
      [onChange],
    );

    const isResolvedAddress = !!resolvedAddress?.displayAddress;

    return (
      <div
        className={`${styles.wrapper} ${
          isResolvedAddress ? styles.resolved : ""
        }`}>
        {onLeftIconClick && (
          <div className={styles.leftIcon}>
            <ChevronLeftIcon onClick={onLeftIconClick} width={24} />
          </div>
        )}
        <div className={styles.element}>
          <div className={styles.label}>{label}</div>
          <Avatar {...avatarUrlProps} />
          <div className={styles.control}>
            {isLoading ? (
              <ShortCopySkeletonLoader lines={1} />
            ) : resolvedAddress?.displayAddress ? (
              <div className={styles.resolvedAddress}>
                <span
                  className={styles.displayAddress}
                  data-testid="recipient-wallet-address">
                  {resolvedAddress.displayAddress}
                </span>
                {resolvedAddress.walletAddress && (
                  <span className={styles.walletAddress}>
                    {resolvedAddress.walletAddress}
                  </span>
                )}
              </div>
            ) : (
              <input
                data-testid="message-to-input"
                tabIndex={0}
                className={styles.input}
                id="address"
                type="text"
                spellCheck="false"
                autoComplete="false"
                autoCorrect="false"
                autoCapitalize="off"
                onChange={handleChange}
                value={value}
                aria-label={ariaLabel}
                ref={ref}
              />
            )}
            <div
              className={`${styles.subtext} ${isError ? styles.error : ""}`}
              data-testid="message-to-subtext">
              {subtext}
            </div>
          </div>
        </div>
        {onTooltipClick && (
          <InformationCircleIcon onClick={onTooltipClick} height="24" />
        )}
      </div>
    );
  },
);

AddressInput.displayName = "AddressInput";
