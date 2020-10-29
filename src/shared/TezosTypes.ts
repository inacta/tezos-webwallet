import { ContractAbstraction, ContractProvider } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';
import { ThanosWallet } from '@thanos-wallet/dapp';
import { BeaconWallet } from '@taquito/beacon-wallet';
import BigNumber from 'bignumber.js';
import { LedgerSigner } from '@taquito/ledger-signer';
import { StringDictionary } from './AbstractTypes';

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
  functionSignatures: StringDictionary<string[]>;
  methods: string[];
  otherStandards: OtherContractStandard[];
  symbol: string;
  tokenStandard: TokenStandard;
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
  FA2 = 'FA2',
  Unknown = 'Unknown'
}

export enum OtherContractStandard {
  KISS = 'KISS'
}

export enum WhitelistVersion {
  NO_WHITELIST = 'NO_WHITELIST',
  V0 = 'V0'
}

export interface IExtraData {
  key: string;
  value: string;
}

export type WalletTypes = InMemorySigner | TezBridgeSigner | ThanosWallet | LedgerSigner | BeaconWallet;

export enum Wallet {
  Thanos = 'THANOS',
  Ledger = 'LEDGER',
  AirGap = 'AIRGAP',
  TezBridge = 'TEZBRIDGE',
  PrivateKey = 'PRIVATE_KEY',
  Address = 'ADDRESS'
}

export interface WalletSpec {
  name: string;
  icon: JSX.Element;
}
