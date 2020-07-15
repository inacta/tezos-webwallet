import { ValidationResult, validateAddress } from '@taquito/utils';
import BigNumber from 'bignumber.js';
import { TezosToolkit } from '@taquito/taquito';

// This file is to define helper functions for FA1.2 and FA2 token implementations

export function getTokenBalance(
  tokenAddress: string,
  accountAddress: string,
  client: TezosToolkit
): Promise<BigNumber> {
  return new Promise((resolve, reject) => {
    if (
      tokenAddress === '' ||
      validateAddress(tokenAddress) !== ValidationResult.VALID ||
      tokenAddress.substring(0, 3) !== 'KT1'
    ) {
      reject(`Invalid token address: ${tokenAddress}`);
    }
    if (accountAddress === '' || validateAddress(accountAddress) !== ValidationResult.VALID) {
      reject(`Invalid account address: ${accountAddress}`);
    }

    var conversionFactor = new BigNumber(1);
    client.contract.at(tokenAddress).then((c) => {
      // eslint-disable @typescript-eslint/no-explicit-any
      c.storage()
        .then((s: any) => {
          if (s.token_metadata) {
            s.token_metadata.get('0').then((md: any) => {
              conversionFactor = new BigNumber(10).pow(md?.decimals ?? 0);
            });
          }

          return s.ledger.get(accountAddress);
        })
        .then((acc: any) =>
          resolve(acc?.balance === undefined ? new BigNumber(0) : new BigNumber(acc.balance).times(conversionFactor))
        )
        .catch((err: any) => reject(err));
    });
  });
}
