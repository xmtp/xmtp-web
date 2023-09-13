import { it, expect, describe, beforeEach } from "vitest";
import { Wallet } from "ethers";
import { Client } from "@xmtp/xmtp-js";
import { getDbInstance, clearCache } from "@/helpers/caching/db";
import {
  getCachedConversationBy,
  getCachedConversationByPeerAddress,
  getCachedConversationByTopic,
  getConversationByTopic,
  hasConversationTopic,
  saveConversation,
  setConversationUpdatedAt,
  toCachedConversation,
  updateConversation,
  updateConversationMetadata,
} from "@/helpers/caching/conversations";
import type {
  CachedConversation,
  CachedConversationWithId,
} from "@/helpers/caching/conversations";
import { adjustDate } from "@/helpers/adjustDate";

const testWallet1 = Wallet.createRandom();
const testWallet2 = Wallet.createRandom();
const db = getDbInstance();

beforeEach(async () => {
  await clearCache(db);
});

describe("getCachedConversationBy", () => {
  it("should return undefined if no conversation is found", async () => {
    const conversation = await getCachedConversationBy(
      "testWalletAddress",
      "topic",
      "testTopic",
      db,
    );
    expect(conversation).toBeUndefined();
    const conversation2 = await getCachedConversationBy(
      "testWalletAddress",
      "id",
      1,
      db,
    );
    expect(conversation2).toBeUndefined();
    const conversation3 = await getCachedConversationBy(
      "testWalletAddress",
      "peerAddress",
      "testPeerAddress",
      db,
    );
    expect(conversation3).toBeUndefined();
    const conversation4 = await getCachedConversationByTopic(
      "testWalletAddress",
      "testTopic",
      db,
    );
    expect(conversation4).toBeUndefined();
    const conversation5 = await getCachedConversationByPeerAddress(
      "testWalletAddress",
      "testPeerAddress",
      db,
    );
    expect(conversation5).toBeUndefined();
  });

  it("should return a conversation if one is found", async () => {
    const testConversation = {
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: "testWalletAddress",
    } satisfies CachedConversationWithId;
    const cachedConversation = await saveConversation(testConversation, db);
    const conversation = await getCachedConversationBy(
      "testWalletAddress",
      "topic",
      "testTopic",
      db,
    );
    expect(conversation).toEqual(cachedConversation);
    const conversation2 = await getCachedConversationBy(
      "testWalletAddress",
      "id",
      1,
      db,
    );
    expect(conversation2).toEqual(cachedConversation);
    const conversation3 = await getCachedConversationBy(
      "testWalletAddress",
      "peerAddress",
      "testPeerAddress",
      db,
    );
    expect(conversation3).toEqual(cachedConversation);
    const conversation4 = await getCachedConversationByTopic(
      "testWalletAddress",
      "testTopic",
      db,
    );
    expect(conversation4).toEqual(cachedConversation);
    const conversation5 = await getCachedConversationByPeerAddress(
      "testWalletAddress",
      "testPeerAddress",
      db,
    );
    expect(conversation5).toEqual(cachedConversation);
  });
});

describe("getConversationByTopic", () => {
  it("should return undefined if no conversation is found", async () => {
    const testClient = await Client.create(testWallet1, { env: "local" });
    const conversation = await getConversationByTopic("testTopic", testClient);
    expect(conversation).toBeUndefined();
  });

  it("should return a conversation if one is found", async () => {
    const testClient1 = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const testConversation = await testClient1.conversations.newConversation(
      testWallet2.address,
      undefined,
    );
    const conversation = await getConversationByTopic(
      testConversation.topic,
      testClient1,
    );
    expect(conversation).toEqual(testConversation);
  });
});

describe("updateConversation", () => {
  it("should update conversation properties", async () => {
    const createdAt = new Date();
    const testConversation = {
      id: 1,
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: "testWalletAddress",
    } satisfies CachedConversationWithId;
    const cachedConversation = await saveConversation(testConversation, db);
    expect(cachedConversation).toEqual(testConversation);

    const updatedAt = adjustDate(createdAt, 1000);

    await updateConversation(
      testConversation.topic,
      {
        isReady: true,
        metadata: { test: "test" },
        updatedAt,
      },
      db,
    );

    const updatedConversation = await getCachedConversationByTopic(
      "testWalletAddress",
      "testTopic",
      db,
    );

    expect(updatedConversation?.isReady).toBe(true);
    expect(updatedConversation?.metadata).toEqual({ test: "test" });
    expect(updatedConversation?.updatedAt).toEqual(updatedAt);
  });
});

describe("updateConversationMetadata", () => {
  it("should update conversation metadata with the right namespace", async () => {
    const createdAt = new Date();
    const testConversation = {
      id: 1,
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: "testWalletAddress",
    } satisfies CachedConversationWithId;
    const cachedConversation = await saveConversation(testConversation, db);
    expect(cachedConversation).toEqual(testConversation);

    await updateConversationMetadata(
      "testWalletAddress",
      "testTopic",
      "test",
      { test: "test" },
      db,
    );

    const updatedConversation = await getCachedConversationByTopic(
      "testWalletAddress",
      "testTopic",
      db,
    );

    expect(updatedConversation?.metadata).toEqual({ test: { test: "test" } });
  });
});

describe("setConversationUpdatedAt", () => {
  it("should update the `updatedAt` field of a cached conversation", async () => {
    const createdAt = new Date();
    const testConversation = {
      id: 1,
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: "testWalletAddress",
    } satisfies CachedConversationWithId;
    const cachedConversation = await saveConversation(testConversation, db);
    expect(cachedConversation.updatedAt).toEqual(createdAt);

    const updatedAt = adjustDate(createdAt, 1000);

    await setConversationUpdatedAt("testTopic", updatedAt, db);

    const conversation = await getCachedConversationByTopic(
      "testWalletAddress",
      "testTopic",
      db,
    );
    expect(conversation?.updatedAt).toEqual(updatedAt);
  });
});

describe("hasConversationTopic", () => {
  it("should return true if the topic exists", async () => {
    const createdAt = new Date();
    const testConversation = {
      id: 1,
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: "testWalletAddress",
    } satisfies CachedConversationWithId;
    const cachedConversation = await saveConversation(testConversation, db);
    expect(cachedConversation).toEqual(testConversation);

    expect(
      await hasConversationTopic("testWalletAddress", "testTopic", db),
    ).toBe(true);
  });

  it("should return false if the topic does not exist", async () => {
    expect(
      await hasConversationTopic("testWalletAddress", "testTopic", db),
    ).toBe(false);
  });
});

describe("saveConversation", () => {
  it("should save a conversation to the cache", async () => {
    const createdAt = new Date();
    const testConversation = {
      id: 1,
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: "testWalletAddress",
    } satisfies CachedConversationWithId;
    const cachedConversation = await saveConversation(testConversation, db);
    expect(cachedConversation).toEqual(testConversation);
  });

  it("should return a duplicate conversation", async () => {
    const createdAt = new Date();
    const testConversation = {
      createdAt,
      updatedAt: createdAt,
      isReady: false,
      topic: "testTopic",
      peerAddress: "testPeerAddress",
      walletAddress: "testWalletAddress",
    } satisfies CachedConversation;
    const cachedConversation = await saveConversation(testConversation, db);
    expect(cachedConversation).toEqual(testConversation);
    const cachedConversation2 = await saveConversation(testConversation, db);
    expect(cachedConversation2).toEqual(testConversation);
    expect(cachedConversation2.id).toBe(cachedConversation.id);
  });
});

describe("toCachedConversation", () => {
  it("should return a cached conversation in the right format", async () => {
    const testClient1 = await Client.create(testWallet1, { env: "local" });
    await Client.create(testWallet2, { env: "local" });
    const testConversation = await testClient1.conversations.newConversation(
      testWallet2.address,
      undefined,
    );
    const cachedConversation = toCachedConversation(
      testConversation,
      testWallet1.address,
    );
    expect(cachedConversation).toEqual({
      context: undefined,
      createdAt: testConversation.createdAt,
      isReady: false,
      peerAddress: testConversation.peerAddress,
      topic: testConversation.topic,
      updatedAt: testConversation.createdAt,
      walletAddress: testWallet1.address,
    });
  });
});
