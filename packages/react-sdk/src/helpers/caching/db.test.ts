import { it, expect, describe } from "vitest";
import Dexie from "dexie";
import { createRandomWallet } from "@/helpers/testing";
import { getDbInstance, getLegacyDB } from "@/helpers/caching/db";
import { reactionContentTypeConfig } from "@/helpers/caching/contentTypes/reaction";
import { replyContentTypeConfig } from "@/helpers/caching/contentTypes/reply";

const testWallet1 = createRandomWallet();
const testWallet2 = createRandomWallet();
const testWallet3 = createRandomWallet();

describe("DB", () => {
  it("should migrate legacy DB to new DB", async () => {
    const legacyDB = getLegacyDB();
    // insert legacy conversations
    const conversationsTable = legacyDB.table("conversations");
    const legacyConversations = [
      {
        createdAt: new Date(),
        peerAddress: testWallet2.account.address,
        topic: "testTopic1",
        updatedAt: new Date(),
        walletAddress: testWallet1.account.address,
      },
      {
        createdAt: new Date(),
        peerAddress: testWallet3.account.address,
        topic: "testTopic2",
        updatedAt: new Date(),
        walletAddress: testWallet1.account.address,
      },
    ];
    await conversationsTable.bulkAdd(legacyConversations);

    // insert legacy messages
    const messagesTable = legacyDB.table("messages");
    const legacyMessages = [
      {
        content: "testMessage1",
        contentType: "text",
        conversationsTopic: "testTopic1",
        senderAddress: testWallet1.account.address,
        sentAt: new Date(),
        status: "processed",
        uuid: "testUuid1",
        walletAddress: testWallet1.account.address,
        xmtpID: "testXmtpID1",
      },
      {
        content: "testMessage2",
        contentType: "reply",
        conversationsTopic: "testTopic1",
        senderAddress: testWallet2.account.address,
        sentAt: new Date(),
        status: "processed",
        uuid: "testUuid2",
        walletAddress: testWallet1.account.address,
        xmtpID: "testXmtpID2",
      },
      {
        content: "testMessage3",
        contentType: "text",
        conversationsTopic: "testTopic2",
        senderAddress: testWallet1.account.address,
        sentAt: new Date(),
        status: "processed",
        uuid: "testUuid3",
        walletAddress: testWallet1.account.address,
        xmtpID: "testXmtpID3",
      },
      {
        content: "testMessage4",
        contentType: "reaction",
        conversationsTopic: "testTopic2",
        senderAddress: testWallet3.account.address,
        sentAt: new Date(),
        status: "processed",
        uuid: "testUuid4",
        walletAddress: testWallet1.account.address,
        xmtpID: "testXmtpID4",
      },
    ];
    await messagesTable.bulkAdd(legacyMessages);

    // insert legacy replies
    const repliesTable = legacyDB.table("replies");
    const legacyReplies = [
      {
        id: 1,
        referenceXmtpID: "testXmtpID1",
        xmtpID: "testXmtpID2",
      },
    ];
    await repliesTable.bulkAdd(legacyReplies);

    // insert legacy reactions
    const reactionsTable = legacyDB.table("reactions");
    const legacyReactions = [
      {
        referenceXmtpID: "testXmtpID3",
        content: "testMessage4",
        schema: "custom",
        senderAddress: testWallet3.account.address,
        sentAt: new Date(),
        xmtpID: "testXmtpID4",
      },
    ];
    await reactionsTable.bulkAdd(legacyReactions);

    // insert legacy consent
    const consentTable = legacyDB.table("consent");
    const legacyConsent = [
      {
        peerAddress: testWallet2.account.address,
        state: "allowed",
        walletAddress: testWallet1.account.address,
      },
    ];
    await consentTable.bulkAdd(legacyConsent);

    legacyDB.close();

    // get new DB and migrate legacy data
    const db = await getDbInstance({
      contentTypeConfigs: [reactionContentTypeConfig, replyContentTypeConfig],
    });

    // check if legacy conversations are migrated
    const conversations = await db.table("conversations").toArray();
    expect(conversations).toEqual(legacyConversations);

    // check if legacy messages are migrated
    const messages = await db.table("messages").toArray();
    expect(messages).toEqual(
      legacyMessages.map((message) => {
        const { xmtpID, ...rest } = message;
        return {
          ...rest,
          id: xmtpID,
        };
      }),
    );

    // check if legacy consent is migrated
    const consent = await db.table("consent").toArray();
    expect(consent).toEqual(
      legacyConsent.map((entry) => {
        const { peerAddress, ...rest } = entry;
        return {
          ...rest,
          type: "address",
          value: peerAddress,
        };
      }),
    );

    // check if legacy replies are migrated
    const replies = await db.table("replies").toArray();
    expect(replies).toEqual(legacyReplies);

    // check if legacy reactions are migrated
    const reactions = await db.table("reactions").toArray();
    expect(reactions).toEqual(
      legacyReactions.map((reaction) => {
        const { xmtpID, ...rest } = reaction;
        return {
          ...rest,
          id: xmtpID,
        };
      }),
    );

    // check if legacy DB is deleted after migration
    await expect(async () => {
      const deletedDb = new Dexie("__XMTP__");
      await deletedDb.open();
    }).rejects.toThrow();
  });
});
