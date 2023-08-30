import type { Attachment } from "@xmtp/content-type-remote-attachment";
import type { CachedMessage } from "@xmtp/react-sdk";
import { useAttachment } from "@xmtp/react-sdk";
import styles from "./Attachment.module.css";

export type AttachmentProps = {
  message: CachedMessage;
};

/**
 * Creating object URLs from blobs is non-deterministic, so we store the
 * generated URLs in a cache so that they can be reused, which results in
 * a more consistent rendering of images/data and less memory usage.
 */
const blobCache = new WeakMap<Uint8Array, string>();

const getBlobURL = (attachment: Attachment) => {
  if (!blobCache.get(attachment.data)) {
    blobCache.set(
      attachment.data,
      URL.createObjectURL(
        new Blob([Buffer.from(attachment.data)], {
          type: attachment.mimeType,
        }),
      ),
    );
  }

  return blobCache.get(attachment.data)!;
};

export const AttachmentContent: React.FC<AttachmentProps> = ({ message }) => {
  const { attachment, status } = useAttachment(message);

  if (status === "error") {
    return "Unable to load attachment";
  }

  if (status === "loading" || !attachment) {
    return "Loading...";
  }

  const blobURL = getBlobURL(attachment);

  if (attachment.mimeType.startsWith("image/")) {
    return (
      <div className={styles.attachment}>
        <img src={blobURL} alt="" />
      </div>
    );
  }

  if (attachment.mimeType.startsWith("audio/")) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <audio controls src={blobURL}>
        <a href={blobURL}>Download instead</a>
      </audio>
    );
  }

  if (attachment.mimeType.startsWith("video/")) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video controls autoPlay>
        <source src={blobURL} type="video/mp4" />
        Video messages not supported.
      </video>
    );
  }

  return (
    <div>
      <a href={blobURL} target="_blank" rel="noopener noreferrer">
        {attachment.filename}
      </a>
    </div>
  );
};
