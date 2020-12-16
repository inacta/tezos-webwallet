import { ContractAbstraction, ContractProvider, TransactionWalletOperation } from '@taquito/taquito';
import { IContractInformation, ITokenMetadata, OtherContractStandard, TokenStandard } from './TezosTypes';
import { Prefix, ValidationResult, b58cencode, prefix, validateAddress } from '@taquito/utils';
import BigNumber from 'bignumber.js';
import { IKissDetails } from './KissTypes';
import { InMemorySigner } from '@taquito/signer';
import { StringDictionary } from './AbstractTypes';
import { TransactionOperation } from '@taquito/taquito/dist/types/operations/transaction-operation';
import configureStore from '../redux/store';

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

export function checkAddress(value: string): string {
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

// If contract is a KISS contract, extract the details of the KISS contract from its storage
export async function getKissDetails(contract: ContractAbstraction<ContractProvider>): Promise<IKissDetails> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage: any = await contract.storage();
  const admin: string = storage.admin;
  const activityLogAddress = storage.external_contract_address;

  return {
    activityLogAddress,
    admin
  };
}

export function getContractInterface(
  contract: ContractAbstraction<ContractProvider>
): [TokenStandard, OtherContractStandard[], string[], StringDictionary<string[]>] {
  const signatures: string[][] = contract.parameterSchema.ExtractSignatures();

  // Sort the functions alphabetically according to function name
  signatures.sort((a, b) => (a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1));
  let signatureDict: StringDictionary<string[]> = {};
  for (let i = 0; i < signatures.length; i++) {
    // 0th element is key, the rest are values of the dict
    // `signatures` is AFAIK guaranteed to have one element, so it's OK to call `shift` here.
    signatureDict[signatures[i][0]] = signatures[i];
    signatureDict[signatures[i][0]].shift();
  }

  const methodNames: string[] = Object.keys(signatureDict);
  let tokenStandard: TokenStandard;
  if (
    // These function names are specified in FA2/TZIP-12
    ['transfer', 'balance_of', 'update_operators', 'token_metadata_registry'].every((mn) => methodNames.includes(mn))
  ) {
    tokenStandard = TokenStandard.FA2;
  } else if (
    // These function names are specified in FA1.2/TZIP-7
    ['transfer', 'approve', 'getAllowance', 'getBalance', 'getTotalSupply'].every((mn) => methodNames.includes(mn))
  ) {
    tokenStandard = TokenStandard.FA1_2;
  } else {
    tokenStandard = TokenStandard.Unknown;
  }

  let otherStandards: OtherContractStandard[] = [];
  if (['register_tandem_claims'].every((mn: string) => methodNames.includes(mn))) {
    otherStandards.push(OtherContractStandard.KISS);
  }

  return [tokenStandard, otherStandards, methodNames, signatureDict];
}

// Taquito supports Wallets and Signers
export function isWallet() {
  const state = store.getState();
  return state.accounts[state.network].wallet;
}

export function getTxHash(op: TransactionOperation | TransactionWalletOperation) {
  return isWallet() ? (op as TransactionWalletOperation).opHash : (op as TransactionOperation).hash;
}

// Given a contract, fetch information about it from the blockchain and return
// an object describing the deployed token contract
export function getContractInformation(contract: ContractAbstraction<ContractProvider>): Promise<IContractInformation> {
  const info = getContractInterface(contract);
  if (info && info[0] === TokenStandard.FA2) {
    return (
      contract
        .storage()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((s: any) => s.token_metadata.get('0'))
        .then((md: ITokenMetadata) => {
          return {
            address: contract.address,
            contract,
            conversionFactor: new BigNumber(10).pow(md?.decimals ?? new BigNumber(0)),
            decimals: md.decimals,
            functionSignatures: info[3],
            methods: info[2],
            symbol: md.symbol,
            otherStandards: info[1],
            tokenStandard: info[0]
          };
        })
    );
  } else if (info && info[0] === TokenStandard.FA1_2) {
    return Promise.resolve({
      address: contract.address,
      contract,
      conversionFactor: new BigNumber(1),
      decimals: 0,
      functionSignatures: info[3],
      methods: info[2],
      otherStandards: info[1],
      symbol: 'Unknown',
      tokenStandard: info[0]
    });
  }

  return Promise.resolve({
    address: contract.address,
    contract,
    conversionFactor: undefined,
    decimals: undefined,
    functionSignatures: info[3],
    methods: info[2],
    otherStandards: info[1],
    symbol: 'Unknown',
    tokenStandard: info[0]
  });
}
