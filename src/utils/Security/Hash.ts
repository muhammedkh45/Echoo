import { compare, hash } from "bcrypt";

/**
 * @description Hashes a given plaintext string using bcrypt's hash function.
 * The saltRounds parameter determines how many times the plaintext is hashed.
 * The function returns a Promise resolving to the hashed string.
 * @param plainText The string to be hashed.
 * @param saltRounds The number of times the plaintext is hashed.
 * @returns Promise<Hashed String>
 */
export const Hash = async (
  plainText: string,
  saltRounds: number = Number(process.env.SALT_ROUNDS)
) => {
  return hash(plainText, saltRounds);
};

/**
 * @description Compares a plaintext string with a hashed string (using bcrypt's compare function).
 * The function returns a Promise resolving to a boolean indicating whether the plaintext matches the hashed string.
 * @param plainText The plaintext string to compare.
 * @param cipherText The hashed string to compare with.
 * @returns Promise<Boolean>
 */
export const Compare = async (plainText: string, cipherText: string) => {
  return compare(plainText, cipherText);
};
