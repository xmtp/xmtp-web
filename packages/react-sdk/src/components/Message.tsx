import { format } from "date-fns";

export type MessageProps = {
  /**
   * What is the content of the message?
   */
  content: React.ReactNode;
  /**
   * What is the datetime of the message?
   */
  datetime: Date;
  /**
   * Is this an incoming message?
   */
  isIncoming?: boolean;
};

export const Message: React.FC<MessageProps> = ({
  content,
  datetime,
  isIncoming,
}) => {
  const alignment = isIncoming ? "items-start" : "items-end";
  const justify = isIncoming ? "justify-start" : "justify-end";
  const contentStyles = isIncoming
    ? "text-md bg-gray-200 rounded-br-lg pl-2"
    : "bg-indigo-600 text-white rounded-bl-lg";

  return (
    <div className="flex flex-col">
      <div className={`text-sm flex flex-col ${alignment}`}>
        <div
          className={`flex flex-col w-1/2 w-fit max-w-[85%] md:max-w-[50%] ${alignment}`}>
          <div
            className={`whitespace-pre-wrap p-2 px-3 rounded-tl-xl rounded-tr-xl my-1 max-w-full break-words ${contentStyles}`}
            data-testid="message-tile-text">
            {content}
          </div>
          <div
            className={`text-xs text-gray-500 w-full flex mb-4 ${justify}`}
            title={datetime.toLocaleString()}>
            {format(datetime, "h:mm a")}
          </div>
        </div>
      </div>
    </div>
  );
};
