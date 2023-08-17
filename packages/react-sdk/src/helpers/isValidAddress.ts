/**
 * Check if a wallet address is valid.
 *
 * @param address The string to validate
 * @returns `true` if address is valid
 */
export const isValidAddress = (address: string) =>
  address.startsWith("0x") && address.length === 42;
