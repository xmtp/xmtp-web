import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { Buffer } from "buffer";
import { webcrypto } from "crypto";

globalThis.Buffer = Buffer;
globalThis.crypto = webcrypto as unknown as Crypto;
