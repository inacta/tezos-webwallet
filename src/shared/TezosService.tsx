// eslint-disable-next-line
import { b58cencode, Prefix, prefix, validateAddress, ValidationResult } from '@taquito/utils';
import { InMemorySigner } from '@taquito/signer';
import configureStore from '../redux/store';
import BigNumber from 'bignumber.js';

const store = configureStore().store;

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

export async function getTokenData(contractAddress: string) {
  if (!isContractAddress(contractAddress)) {
    return;
  }
  const state = store.getState();
  const contract = await state.net2client[state.network].contract.at(contractAddress);
  const storage: any = await contract.storage();
  return await storage.token_metadata.get('0');
}

export function convertMap(map: Map<string, string>): Object {
  return [...map.entries()].reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
}

export async function getTokenBalance(contractAddress: string, holderAddress: string): Promise<string> {
  if (!isContractAddress(contractAddress)) {
    return;
  }
  const state = store.getState();
  const contract = await state.net2client[state.network].contract.at(contractAddress);
  const storage: any = await contract.storage();
  const token_metadata = await storage.token_metadata.get('0');
  const balance: BigNumber = (await storage.ledger.get(holderAddress)).balance;
  const adjustedBalance = balance.dividedBy(new BigNumber(10).pow(token_metadata.decimals));

  return adjustedBalance.toString();
}
