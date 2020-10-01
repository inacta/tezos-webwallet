/* eslint-disable */
import { b58cencode, Prefix, prefix, validateAddress, ValidationResult } from '@taquito/utils';
import { InMemorySigner } from '@taquito/signer';
import configureStore from '../redux/store';
import { addNotification } from './NotificationService';
import { TokenStandard } from './TezosTypes';
import { ContractAbstraction, ContractProvider, TransactionWalletOperation } from '@taquito/taquito';
import { TransactionOperation } from '@taquito/taquito/dist/types/operations/transaction-operation';

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

export function checkAddress(value): string {
  const res = validateAddress(value);
  if (res === ValidationResult.NO_PREFIX_MATCHED) {
    return 'Invalid Address: no prefix matched';
  } else if (res === ValidationResult.INVALID_CHECKSUM) {
    return 'Invalid Address: Invalid checksum';
  } else if (res === ValidationResult.INVALID_LENGTH) {
    return 'Invalid Address: Invalid length';
  }
  return '';
}

export function isValidAddress(address: string): boolean {
  return validateAddress(address) === ValidationResult.VALID;
}

export const CONTRACT_ADDRESS_PREFIX = 'KT1';

export function isContractAddress(address: string) {
  if (!address || address.length < 3) {
    return false;
  }

  // A valid contract address starts with 'KT1'
  return address.substring(0, 3) === CONTRACT_ADDRESS_PREFIX && validateAddress(address) === ValidationResult.VALID;
}

function getObjectMethodNames(obj: any): string[] {
  if (!obj) {
    return [];
  }

  return Object.getOwnPropertyNames(obj)
    .filter((p) => typeof obj[p] === 'function')
    .map((name) => name.toLowerCase());
}

export function getContractInterface(contract: ContractAbstraction<ContractProvider>): [TokenStandard, string[]] {
  const methodNames: string[] = getObjectMethodNames(contract.methods);
  let standard;
  if (
    // These function names are specified in FA2/TZIP-12
    ['transfer', 'balance_of', 'update_operators', 'token_metadata_registry'].every((mn) => methodNames.includes(mn))
  ) {
    standard = TokenStandard.FA2;
  } else if (
    // These function names are specified in FA1.2/TZIP-7
    ['transfer', 'approve', 'get_allowance', 'get_balance', 'get_total_supply'].every((mn) => methodNames.includes(mn))
  ) {
    standard = TokenStandard.FA1_2;
  }
  return [standard, methodNames];
}

// Taquito supports Wallets and Signers
export function isWallet() {
  const state = store.getState();
  return state.accounts[state.network].wallet;
}

export function getTxHash(op: TransactionOperation | TransactionWalletOperation) {
  return isWallet() ? (op as TransactionWalletOperation).opHash : (op as TransactionOperation).hash;
}
