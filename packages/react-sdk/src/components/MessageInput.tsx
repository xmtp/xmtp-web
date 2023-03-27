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

export type MessageInputProps = {
  /**
   * What happens on a submit?
   */
  onSubmit?: (msg: string) => Promise<void>;
  /**
   * Is the CTA button disabled?
   */
  isDisabled?: boolean;
};

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  ({ onSubmit, isDisabled }, ref) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    // make external ref point to internal ref
    useImperativeHandle<HTMLTextAreaElement | null, HTMLTextAreaElement | null>(
      ref,
      () => textAreaRef.current,
    );
    const [value, setValue] = useState("");
    const onChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
      setValue(event.target.value);
    const borderStyles =
      "border border-gray-300 focus-within:border-1 focus-within:border-indigo-600 rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl";
    const textAreaStyles = `${
      textAreaRef?.current?.scrollHeight &&
      textAreaRef?.current?.scrollHeight <= 32
        ? "max-h-8"
        : "max-h-40"
    } min-h-8 outline-none border-none focus:ring-0 resize-none mx-4 p-1 w-full text-md text-gray-900`;

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
      const MIN_TEXTAREA_HEIGHT = 32;
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
        <label htmlFor="chat" className="sr-only">
          Type something...
        </label>
        <div
          className={`flex items-center max-h-300 mx-4 my-2 bg-white relative no-scrollbar z-10 p-1 ${borderStyles}`}>
          <textarea
            id="chat"
            data-testid="message-input"
            onChange={onChange}
            onKeyDown={handleKeyDown}
            ref={textAreaRef}
            rows={1}
            className={textAreaStyles}
            placeholder="Type something..."
            value={value}
            disabled={isDisabled}
          />
          <div className="flex items-end absolute bottom-1.5 right-1">
            <IconButton
              testId="message-input-submit"
              variant="secondary"
              label={<ArrowUpIcon color="white" width="12" />}
              srText="Submit Message"
              onClick={handleClick}
              isDisabled={!value || isDisabled}
            />
          </div>
        </div>
      </div>
    );
  },
);

MessageInput.displayName = "MessageInput";
