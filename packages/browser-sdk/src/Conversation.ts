import { ContentTypeText } from "@xmtp/content-type-text";
import type { ContentTypeId } from "@xmtp/content-type-primitives";
import type { Client } from "@/Client";
import type { ListMessagesOptions } from "@/types";
import { DecodeMessage } from "@/DecodedMessage";
import type { SafeConversation } from "@/utils/conversions";
import { nsToDate } from "@/utils/date";

export class Conversation {
  #client: Client;

  #id: string;

  #name?: SafeConversation["name"];

  #imageUrl?: SafeConversation["imageUrl"];

  #description?: SafeConversation["description"];

  #pinnedFrameUrl?: SafeConversation["pinnedFrameUrl"];

  #isActive?: SafeConversation["isActive"];

  #addedByInboxId?: SafeConversation["addedByInboxId"];

  #metadata?: SafeConversation["metadata"];

  #admins?: SafeConversation["admins"];

  #superAdmins?: SafeConversation["superAdmins"];

  #permissions?: SafeConversation["permissions"];

  #createdAtNs?: SafeConversation["createdAtNs"];

  constructor(client: Client, id: string, data?: SafeConversation) {
    this.#client = client;
    this.#id = id;
    this.#syncData(data);
  }

  #syncData(data?: SafeConversation) {
    this.#name = data?.name ?? "";
    this.#imageUrl = data?.imageUrl ?? "";
    this.#description = data?.description ?? "";
    this.#pinnedFrameUrl = data?.pinnedFrameUrl ?? "";
    this.#isActive = data?.isActive ?? undefined;
    this.#addedByInboxId = data?.addedByInboxId ?? "";
    this.#metadata = data?.metadata ?? undefined;
    this.#admins = data?.admins ?? [];
    this.#superAdmins = data?.superAdmins ?? [];
    this.#permissions = data?.permissions ?? undefined;
    this.#createdAtNs = data?.createdAtNs ?? undefined;
  }

  get id() {
    return this.#id;
  }

  get name() {
    return this.#name;
  }

  async updateName(name: string) {
    return this.#client.sendMessage("updateGroupName", {
      id: this.#id,
      name,
    });
  }

  get imageUrl() {
    return this.#imageUrl;
  }

  async updateImageUrl(imageUrl: string) {
    return this.#client.sendMessage("updateGroupImageUrlSquare", {
      id: this.#id,
      imageUrl,
    });
  }

  get description() {
    return this.#description;
  }

  async updateDescription(description: string) {
    return this.#client.sendMessage("updateGroupDescription", {
      id: this.#id,
      description,
    });
  }

  get pinnedFrameUrl() {
    return this.#pinnedFrameUrl;
  }

  async updatePinnedFrameUrl(pinnedFrameUrl: string) {
    return this.#client.sendMessage("updateGroupPinnedFrameUrl", {
      id: this.#id,
      pinnedFrameUrl,
    });
  }

  get isActive() {
    return this.#isActive;
  }

  get addedByInboxId() {
    return this.#addedByInboxId;
  }

  get createdAtNs() {
    return this.#createdAtNs;
  }

  get createdAt() {
    return this.#createdAtNs ? nsToDate(this.#createdAtNs) : undefined;
  }

  get metadata() {
    return this.#metadata;
  }

  async members() {
    return this.#client.sendMessage("getGroupMembers", {
      id: this.#id,
    });
  }

  get admins() {
    return this.#admins;
  }

  get superAdmins() {
    return this.#superAdmins;
  }

  get permissions() {
    return this.#permissions;
  }

  isAdmin(inboxId: string) {
    return this.#admins?.includes(inboxId) ?? false;
  }

  isSuperAdmin(inboxId: string) {
    return this.#superAdmins?.includes(inboxId) ?? false;
  }

  async sync() {
    const data = await this.#client.sendMessage("syncGroup", {
      id: this.#id,
    });
    this.#syncData(data);
  }

  async addMembers(accountAddresses: string[]) {
    return this.#client.sendMessage("addGroupMembers", {
      id: this.#id,
      accountAddresses,
    });
  }

  async addMembersByInboxId(inboxIds: string[]) {
    return this.#client.sendMessage("addGroupMembersByInboxId", {
      id: this.#id,
      inboxIds,
    });
  }

  async removeMembers(accountAddresses: string[]) {
    return this.#client.sendMessage("removeGroupMembers", {
      id: this.#id,
      accountAddresses,
    });
  }

  async removeMembersByInboxId(inboxIds: string[]) {
    return this.#client.sendMessage("removeGroupMembersByInboxId", {
      id: this.#id,
      inboxIds,
    });
  }

  async addAdmin(inboxId: string) {
    return this.#client.sendMessage("addGroupAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  async removeAdmin(inboxId: string) {
    return this.#client.sendMessage("removeGroupAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  async addSuperAdmin(inboxId: string) {
    return this.#client.sendMessage("addGroupSuperAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  async removeSuperAdmin(inboxId: string) {
    return this.#client.sendMessage("removeGroupSuperAdmin", {
      id: this.#id,
      inboxId,
    });
  }

  async publishMessages() {
    return this.#client.sendMessage("publishGroupMessages", {
      id: this.#id,
    });
  }

  async sendOptimistic(content: any, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new Error(
        "Content type is required when sending content other than text",
      );
    }

    const safeEncodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : this.#client.encodeContent(content, contentType!);

    return this.#client.sendMessage("sendOptimisticGroupMessage", {
      id: this.#id,
      content: safeEncodedContent,
    });
  }

  async send(content: any, contentType?: ContentTypeId) {
    if (typeof content !== "string" && !contentType) {
      throw new Error(
        "Content type is required when sending content other than text",
      );
    }

    const safeEncodedContent =
      typeof content === "string"
        ? this.#client.encodeContent(content, contentType ?? ContentTypeText)
        : this.#client.encodeContent(content, contentType!);

    return this.#client.sendMessage("sendGroupMessage", {
      id: this.#id,
      content: safeEncodedContent,
    });
  }

  async messages(options?: ListMessagesOptions) {
    const messages = await this.#client.sendMessage("getGroupMessages", {
      id: this.#id,
      options,
    });

    return messages.map((message) => new DecodeMessage(this.#client, message));
  }
}