import type { ContentTypeId } from "@xmtp/content-type-primitives";
import {
  WasmDeliveryStatus,
  WasmGroupMessageKind,
} from "@xmtp/client-bindings-wasm";
import type { Client } from "@/Client";
import type { SafeMessage } from "@/utils/conversions";
import { fromSafeContentTypeId } from "@/utils/conversions";

export type MessageKind = "application" | "membership_change";
export type MessageDeliveryStatus = "unpublished" | "published" | "failed";

export class DecodeMessage {
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

  sentAtNs: bigint;

  constructor(client: Client, message: SafeMessage) {
    this.#client = client;
    this.id = message.id;
    this.sentAtNs = message.sentAtNs;
    this.conversationId = message.convoId;
    this.senderInboxId = message.senderInboxId;

    switch (message.kind) {
      case WasmGroupMessageKind.Application:
        this.kind = "application";
        break;
      case WasmGroupMessageKind.MembershipChange:
        this.kind = "membership_change";
        break;
      // no default
    }

    switch (message.deliveryStatus) {
      case WasmDeliveryStatus.Unpublished:
        this.deliveryStatus = "unpublished";
        break;
      case WasmDeliveryStatus.Published:
        this.deliveryStatus = "published";
        break;
      case WasmDeliveryStatus.Failed:
        this.deliveryStatus = "failed";
        break;
      // no default
    }

    this.contentType = fromSafeContentTypeId(message.content.type!);
    this.parameters = message.content.parameters as Record<string, string>;
    this.fallback = message.content.fallback;
    this.compression = message.content.compression;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.content = this.#client.decodeContent(message, this.contentType);
  }
}