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

export enum Net {
  Mainnet = 'Mainnet',
  Testnet = 'Testnet'
}

export enum TransactionState {
  waiting = 'Waiting',
  failed = 'Failed',
  success = 'Success'
}
