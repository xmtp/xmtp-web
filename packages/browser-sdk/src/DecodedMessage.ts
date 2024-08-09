import { ContentTypeId } from "@xmtp/content-type-primitives";
import type { Client } from "@/Client";
import { nsToDate } from "@/helpers/date";
import type { MessageDeliveryStatus, MessageKind, WasmMessage } from "@/types";

export class DecodedMessage {
  #client: Client;

  content: any;

  contentType: ContentTypeId;

  conversationId: string;

  deliveryStatus: MessageDeliveryStatus;

  fallback?: string;

  compression?: number;

  id: string;

  kind: MessageKind;

  parameters: Record<string, string>;

  senderInboxId: string;

  sentAt: Date;

  sentAtNs: number;

  constructor(client: Client, message: WasmMessage) {
    this.#client = client;
    this.id = message.id;
    this.sentAtNs = message.sentAtNs;
    this.sentAt = nsToDate(message.sentAtNs);
    this.conversationId = message.convoId;
    this.senderInboxId = message.senderInboxId;

    switch (message.kind) {
      case 0:
        this.kind = "application";
        break;
      case 1:
        this.kind = "membership_change";
        break;
      default:
        throw new Error(`Unknown message kind: ${message.kind}`);
    }

    switch (message.deliveryStatus) {
      case 0:
        this.deliveryStatus = "unpublished";
        break;
      case 1:
        this.deliveryStatus = "published";
        break;
      case 2:
        this.deliveryStatus = "failed";
        break;
      default:
        throw new Error(
          `Unknown message delivery status: ${message.deliveryStatus}`,
        );
    }

    this.contentType = new ContentTypeId(message.content.type!);
    this.parameters = message.content.parameters;
    this.fallback = message.content.fallback;
    this.compression = message.content.compression;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.content = this.#client.decodeContent(message, this.contentType);
  }
}
