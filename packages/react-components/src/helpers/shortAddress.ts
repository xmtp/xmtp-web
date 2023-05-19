/**
 * Shorten a wallet address that is more than 10 characters.
 * Address must start with `0x`.
 */
export const shortAddress = (addr: string): string =>
  addr.length > 10 && addr.startsWith("0x")
    ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
    : addr;
