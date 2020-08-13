// eslint-disable-next-line
import { b58cencode, Prefix, prefix, validateAddress, ValidationResult } from '@taquito/utils';
import { InMemorySigner } from '@taquito/signer';

export function generatePrivateKey() {
  // define empty Uint8 Array for private key
  let randomBytes = new Uint8Array(32);
  // Cryptographically secure PRNG
  window.crypto.getRandomValues(randomBytes);

  return b58cencode(randomBytes, prefix[Prefix.SPSK]);
}

export function isValidSecretKey(key: string): boolean {
  try {
    new InMemorySigner(key);
    return true;
  } catch (error) {
    return false;
  }
}

export const CONTRACT_ADDRESS_PREFIX = 'KT1';

export function isContractAddress(address: string) {
  if (!address || address.length < 3) {
    return false;
  }

  // A valid contract address starts with 'KT1'
  return address.substring(0, 3) === CONTRACT_ADDRESS_PREFIX && validateAddress(address) === ValidationResult.VALID;
}

export async function getTokenData(client, contractAddress: string) {
  const contract = await client.contract.at(contractAddress);
  const storage = await contract.storage();
  return await storage.token_metadata.get('0');
}
