import { ContractAbstraction, ContractProvider, TezosToolkit } from '@taquito/taquito';
import { IContractInformation, ITokenMetadata, TokenStandard } from './TezosTypes';
import { ValidationResult, validateAddress } from '@taquito/utils';
import BigNumber from 'bignumber.js';
import { getContractInterface } from './TezosUtil';

// This file is to define helper functions for FA1.2 and FA2 token implementations

export const CONTRACT_ADDRESS_PREFIX = 'KT1';

// A valid contract address starts with 'KT1'
export function isContractAddress(address: string) {
  if (!address || address.length < 3) {
    return false;
  }

  return address.substring(0, 3) === CONTRACT_ADDRESS_PREFIX && validateAddress(address) === ValidationResult.VALID;
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
    methods: info[2],
    otherStandards: info[1],
    symbol: 'Unknown',
    tokenStandard: info[0]
  });
}

export function getSymbol(info: IContractInformation): string {
  if (!info || info.tokenStandard !== TokenStandard.FA2) {
    return 'tokens';
  } else {
    return info.symbol;
  }
}

export function getTokenBalance(
  tokenAddress: string,
  accountAddress: string,
  client: TezosToolkit
): Promise<BigNumber> {
  return new Promise((resolve, reject) => {
    if (!isContractAddress(tokenAddress)) {
      reject(`Invalid token address: ${tokenAddress}`);
    }
    if (accountAddress === '' || validateAddress(accountAddress) !== ValidationResult.VALID) {
      reject(`Invalid account address: ${accountAddress}`);
    }

    var conversionFactor = new BigNumber(1);
    client.contract.at(tokenAddress).then((c) => {
      c.storage()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((s: any) => {
          if (s.token_metadata) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            s.token_metadata.get('0').then((md: any) => {
              conversionFactor = new BigNumber(10).pow(md?.decimals ?? 0);
            });
          }

          return s.ledger.get(accountAddress);
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((acc: any) =>
          resolve(
            acc?.balance === undefined ? new BigNumber(0) : new BigNumber(acc.balance).dividedBy(conversionFactor)
          )
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((err: any) => reject(err));
    });
  });
}
