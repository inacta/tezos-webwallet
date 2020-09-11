/* eslint-disable */
import { b58cencode, Prefix, prefix, validateAddress, ValidationResult } from '@taquito/utils';
import { InMemorySigner } from '@taquito/signer';
import configureStore from '../redux/store';
import BigNumber from 'bignumber.js';
import { FA2_BASIC, FA2_BASIC_STORAGE, FA1_2_WHITELIST, FA1_2_WHITELIST_STORAGE } from './ContractAssembly';
import { addPermanentNotification, removeNotification, addNotification } from './NotificationService';
import { IExtraData, TokenStandard } from './TezosTypes';

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
    return 'Invalid checksum';
  } else if (res === ValidationResult.INVALID_LENGTH) {
    return 'Invalid length';
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

export async function estimateCosts(recipient: string, amount: number) {
  const state = store.getState();
  return await state.net2client[state.network].estimate.transfer({ to: recipient, amount });
}

export async function transferTezos(
  recipient: string,
  amount: number,
  afterDeploymentCallback: Function,
  afterConfirmationCallback: Function
): Promise<void> {
  const state = store.getState();
  state.net2client[state.network].contract
    .transfer({
      to: recipient,
      amount: amount
    })
    .then((op) => {
      if (afterDeploymentCallback) {
        afterDeploymentCallback();
      }
      const id = addPermanentNotification('Transaction was sent successfully: ' + op.hash);
      op.confirmation(1)
        .then(() => {
          addNotification('success', 'Transaction completed successfully');
        })
        .catch((e) => {
          addNotification('danger', 'Transaction failed');
        })
        .finally(() => {
          removeNotification(id);
          if (afterConfirmationCallback) {
            afterConfirmationCallback();
          }
        });
    });
}

export async function getTokenData(contractAddress: string, tokenType: TokenStandard) {
  if (!isContractAddress(contractAddress)) {
    return;
  }
  const state = store.getState();
  const contract = await state.net2client[state.network].contract.at(contractAddress);
  const storage: any = await contract.storage();
  if (tokenType === TokenStandard.fa2) {
    return await storage.token_metadata.get('0');
  } else if (tokenType === TokenStandard.fa1_2) {
    return storage;
  } else {
    throw new Error('not implemented');
  }
}

export function convertMap(map: Map<string, string>): Record<string, string> {
  return [...map.entries()].reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
}

export async function getTokenBalance(
  contractAddress: string,
  holderAddress: string,
  tokenType: TokenStandard
): Promise<string> {
  if (!isContractAddress(contractAddress)) {
    return;
  }
  const state = store.getState();
  const contract = await state.net2client[state.network].contract.at(contractAddress);
  const storage: any = await contract.storage();
  if (tokenType === TokenStandard.fa2) {
    const token_metadata = await storage.token_metadata.get('0');
    const balance: BigNumber = (await storage.ledger.get(holderAddress))?.balance ?? new BigNumber(0);
    const adjustedBalance = balance.dividedBy(new BigNumber(10).pow(token_metadata.decimals));

    return adjustedBalance.toFixed();
  } else if (tokenType === TokenStandard.fa1_2) {
    const ledgerEntry = await storage.ledger.get(holderAddress);
    return ledgerEntry.balance.toFixed();
  } else {
    throw new Error('not implemented');
  }
}

export function deployToken(
  tokenStandard: TokenStandard,
  tokenName: string,
  tokenSymbol: string,
  decimals: string,
  issuedTo: string,
  amountIssued: string,
  extraData: IExtraData[],
  addTokenReduxCallback: Function,
  afterDeploymentCallback?: Function,
  afterConfirmationCallback?: Function
) {
  let storage;
  let byteCode;
  if (tokenStandard === TokenStandard.fa1_2) {
    byteCode = FA1_2_WHITELIST;
    storage = FA1_2_WHITELIST_STORAGE(issuedTo, amountIssued, issuedTo, issuedTo, issuedTo, issuedTo);
  } else if (tokenStandard === TokenStandard.fa2) {
    byteCode = FA2_BASIC;
    // format extra fields
    const convertedExtraData = [];
    for (const dataField of extraData) {
      convertedExtraData.push({ prim: 'Elt', args: [{ string: dataField.key }, { string: dataField.value }] });
    }
    // replace values in storage binary
    storage = FA2_BASIC_STORAGE(
      issuedTo,
      amountIssued,
      decimals,
      JSON.stringify(convertedExtraData),
      tokenName,
      tokenSymbol
    );
  } else {
    throw new Error('unsupported token type');
  }

  // deploy contract
  const state = store.getState();
  state.net2client[state.network].contract
    .originate({
      code: JSON.parse(byteCode),
      init: JSON.parse(storage)
    })
    .then((originationOp) => {
      const contractId = addPermanentNotification('The smart contract is deploying...');
      if (afterDeploymentCallback) {
        afterDeploymentCallback();
      }
      // get contract
      originationOp.contract().then((contract) => {
        originationOp.confirmation(1).then(() => {
          if (afterConfirmationCallback) {
            afterConfirmationCallback();
          }
          // remove pending contract deployment notification
          removeNotification(contractId);
          if (tokenStandard === TokenStandard.fa1_2) {
            // update redux store
            addTokenReduxCallback(state.network, contract.address, {
              type: TokenStandard.fa1_2,
              name: tokenName,
              symbol: tokenSymbol
            });
            addNotification('success', 'The token was added successfully');
          } else if (tokenStandard === TokenStandard.fa2) {
            const tokenId = addNotification('success', 'The smart contract deployed successfully, adding token...');
            getTokenData(contract.address, tokenStandard).then((fetchedTokenData) => {
              removeNotification(tokenId);
              // update redux store
              addTokenReduxCallback(state.network, contract.address, {
                name: fetchedTokenData.name,
                symbol: fetchedTokenData.symbol,
                decimals: fetchedTokenData.decimals,
                extras: convertMap(fetchedTokenData.extras)
              });
              addNotification('success', 'The token was added successfully');
            });
          }
        });
      });
    });
}
