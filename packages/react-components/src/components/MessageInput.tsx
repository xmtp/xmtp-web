import type { ChangeEvent, KeyboardEvent } from "react";
import {
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
  useLayoutEffect,
  useRef,
} from "react";
import { ArrowUpIcon } from "@heroicons/react/24/solid";
import { IconButton } from "./IconButton";
import styles from "./MessageInput.module.css";

export type MessageInputProps = {
  /**
   * Is the CTA button disabled?
   */
  isDisabled?: boolean;
  /**
   * What happens on a submit?
   */
  onSubmit?: (msg: string) => Promise<void>;
  /**
   * What, if any, placeholder should we use for the input?
   */
  placeholder?: string;
  /**
   * What, if any, screen reader text should be used for the submit button
   */
  submitSrText?: string;
};

const MIN_TEXTAREA_HEIGHT = 32;

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  ({ isDisabled, onSubmit, placeholder, submitSrText }, ref) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    // make external ref point to internal ref
    useImperativeHandle<HTMLTextAreaElement | null, HTMLTextAreaElement | null>(
      ref,
      () => textAreaRef.current,
    );
    const [value, setValue] = useState("");
    const onChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
      setValue(event.target.value);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (value) {
            void onSubmit?.(value);
            setValue("");
          }
        }
      },
      [onSubmit, value],
    );

    const handleClick = useCallback(() => {
      if (value) {
        void onSubmit?.(value);
        setValue("");
      }
    }, [onSubmit, value]);

    useLayoutEffect(() => {
      if (textAreaRef?.current?.value) {
        const currentScrollHeight = textAreaRef?.current.scrollHeight;
        textAreaRef.current.style.height = `${Math.max(
          currentScrollHeight,
          MIN_TEXTAREA_HEIGHT,
        )}px`;
      } else if (textAreaRef?.current) {
        textAreaRef.current.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
      }
    }, [value]);

    return (
      <div>
        {placeholder && (
          <label htmlFor="chat" className={styles.label}>
            {placeholder}
          </label>
        )}
        <div className={styles.wrapper}>
          <textarea
            name="chat"
            data-testid="message-input"
            onChange={onChange}
            onKeyDown={handleKeyDown}
            ref={textAreaRef}
            rows={1}
            className={styles.input}
            placeholder={placeholder}
            value={value}
            disabled={isDisabled}
          />
          <IconButton
            testId="message-input-submit"
            variant="secondary"
            label={<ArrowUpIcon color="white" width="20" />}
            srText={submitSrText}
            onClick={handleClick}
            isDisabled={!value || isDisabled}
          />
        </div>
      </div>
    );
  },
);

MessageInput.displayName = "MessageInput";
