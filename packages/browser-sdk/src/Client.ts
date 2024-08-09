import type {
  ContentCodec,
  ContentTypeId,
  EncodedContent,
} from "@xmtp/content-type-primitives";
import { TextCodec } from "@xmtp/content-type-text";
import type {
  ClientOptions,
  WasmClient,
  WasmConversations,
  WasmMessage,
} from "@/types";
import { Conversations } from "@/Conversations";
// import { ApiUrls } from "@/constants";

export class Client {
  #innerClient: WasmClient;

  #conversations: Conversations;

  #codecs: Map<string, ContentCodec<any>>;

  constructor(client: WasmClient, codecs: ContentCodec<any>[]) {
    this.#innerClient = client;
    this.#conversations = new Conversations(this, {} as WasmConversations);
    this.#codecs = new Map(
      codecs.map((codec) => [codec.contentType.toString(), codec]),
    );
  }

  static create(accountAddress: string, options?: ClientOptions) {
    // const host = options?.apiUrl ?? ApiUrls[options?.env ?? "dev"];
    // const isSecure = host.startsWith("https");
    // const inboxId =
    //   (await getInboxIdForAddress(host, isSecure, accountAddress)) ||
    //   generateInboxId(accountAddress);

    return new Client({} as WasmClient, [
      new TextCodec(),
      ...(options?.codecs ?? []),
    ]);
  }

  get accountAddress() {
    return this.#innerClient.accountAddress;
  }

  get inboxId() {
    return this.#innerClient.inboxId();
  }

  get installationId() {
    return this.#innerClient.installationId();
  }

  get isRegistered() {
    return this.#innerClient.isRegistered();
  }

  get signatureText() {
    return this.#innerClient.signatureText();
  }

  async canMessage(accountAddresses: string[]) {
    return this.#innerClient.canMessage(accountAddresses);
  }

  addEcdsaSignature(signatureBytes: Uint8Array) {
    this.#innerClient.addEcdsaSignature(signatureBytes);
  }

  addScwSignature(
    signatureBytes: Uint8Array,
    chainId: string,
    accountAddress: string,
    chainRpcUrl: string,
    blockNumber: bigint,
  ) {
    this.#innerClient.addScwSignature(
      signatureBytes,
      chainId,
      accountAddress,
      chainRpcUrl,
      blockNumber,
    );
  }

  async registerIdentity() {
    return this.#innerClient.registerIdentity();
  }

  get conversations() {
    return this.#conversations;
  }

  codecFor(contentType: ContentTypeId) {
    return this.#codecs.get(contentType.toString());
  }

  encodeContent(content: any, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new Error(`no codec for ${contentType.toString()}`);
    }
    const encoded = codec.encode(content, this);
    const fallback = codec.fallback(content);
    if (fallback) {
      encoded.fallback = fallback;
    }
    return encoded;
  }

  decodeContent(message: WasmMessage, contentType: ContentTypeId) {
    const codec = this.codecFor(contentType);
    if (!codec) {
      throw new Error(`no codec for ${contentType.toString()}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return codec.decode(message.content as EncodedContent, this);
  }

  async requestHistorySync() {
    return this.#innerClient.requestHistorySync();
  }

  async getInboxIdByAddress(accountAddress: string) {
    return this.#innerClient.findInboxIdByAddress(accountAddress);
  }
}
