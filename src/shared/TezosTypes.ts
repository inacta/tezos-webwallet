import { ContractAbstraction, ContractProvider } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';
import { ThanosWallet } from '@thanos-wallet/dapp';
// eslint-disable-next-line sort-imports
import BigNumber from 'bignumber.js';

export interface IContractOriginationStatus {
  addressOfNewContract: string | undefined;
  clearCallback: () => void;
  hash: string | undefined;
  message: string;
  state: TransactionState;
}

export interface IPaymentStatus {
  clearCallback: () => void;
  hash: string | undefined;
  message: string;
  net: Net;
  state: TransactionState;
}

// Description of a Tezos smart contract
export interface IContractInformation {
  address: string;
  contract: ContractAbstraction<ContractProvider>;
  conversionFactor: BigNumber | undefined;
  decimals: number | undefined;
  symbol: string;
  tokenStandard: TokenStandard;
  methods: string[];
}

export interface ITokenMetadata {
  token_id: number;
  symbol: string;
  name: string;
  decimals: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extras: any;
}

export enum Net {
  Mainnet = 'Mainnet',
  Carthage = 'Carthage'
}

export enum TransactionState {
  waiting = 'Waiting',
  failed = 'Failed',
  success = 'Success'
}

export enum TokenStandard {
  FA1_2 = 'FA1_2',
  FA2 = 'FA2'
}

export enum WhitelistVersion {
  NO_WHITELIST = 'NO_WHITELIST',
  V0 = 'V0'
}

export interface IExtraData {
  key: string;
  value: string;
}

export type Wallets = 'privKey' | 'tezbridge' | 'file' | 'ledger' | 'thanos';
export type WalletTypes = InMemorySigner | TezBridgeSigner | ThanosWallet;
