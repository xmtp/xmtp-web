/**
 * Check if a wallet address is valid.
 */
export const isValidAddress = (address: string) =>
  address.startsWith("0x") && address.length === 42;
