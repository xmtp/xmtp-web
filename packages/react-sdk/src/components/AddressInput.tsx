import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { forwardRef } from "react";
import { Avatar } from "./Avatar";
import { ShortCopySkeletonLoader } from "./SkeletonLoaders/ShortCopySkeletonLoader";

export type AddressInputProps = {
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
};

export const AddressInput = forwardRef<HTMLInputElement, AddressInputProps>(
  (
    {
      resolvedAddress,
      subtext,
      avatarUrlProps,
      onChange,
      isError,
      isLoading,
      onTooltipClick,
      value,
    },
    ref,
  ) => {
    const subtextColor = isError ? "text-red-600" : "text-gray-400";
    return (
      <div className="flex px-2 md:px-4 py-3 border-b border-gray-100 border-l-0 z-10 max-h-sm w-full">
        <div className="flex items-center flex-grow">
          <Avatar {...avatarUrlProps} />
          <div className="ml-2 md:ml-4 flex flex-col justify-center flex-grow">
            {isLoading ? (
              <ShortCopySkeletonLoader lines={1} />
            ) : resolvedAddress?.displayAddress ? (
              <div className="flex flex-col text-md py-1">
                <span
                  className="font-bold h-4 mb-2 ml-0"
                  data-testid="recipient-wallet-address">
                  {resolvedAddress.displayAddress}
                </span>
                {resolvedAddress.walletAddress && (
                  <span className="text-sm font-mono">
                    {resolvedAddress.walletAddress}
                  </span>
                )}
              </div>
            ) : (
              <input
                data-testid="message-to-input"
                tabIndex={0}
                className="text-gray-700 px-0 h-4 m-2 ml-0 font-mono text-sm w-full leading-tight border-none focus:ring-0 cursor-text"
                id="address"
                type="text"
                spellCheck="false"
                autoComplete="false"
                autoCorrect="false"
                autoCapitalize="off"
                onChange={(e) => onChange?.(e.target.value)}
                value={value}
                aria-label="Address Input"
                ref={ref}
              />
            )}
            <p
              className={`font-mono text-sm ${subtextColor}`}
              data-testid="message-to-subtext">
              {subtext}
            </p>
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
