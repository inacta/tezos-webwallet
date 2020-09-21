/* eslint-disable */
import { b58cencode, Prefix, prefix, validateAddress, ValidationResult } from '@taquito/utils';
import { InMemorySigner } from '@taquito/signer';
import configureStore from '../redux/store';
import BigNumber from 'bignumber.js';
import {
  FA2_BASIC,
  FA2_BASIC_STORAGE,
  FA1_2_WHITELIST,
  FA1_2_WHITELIST_STORAGE,
  FA1_2_BASIC,
  FA1_2_BASIC_STORAGE
} from './ContractAssembly';
import { addPermanentNotification, removeNotification, addNotification } from './NotificationService';
import { IExtraData, Net, TokenStandard, WhitelistVersion } from './TezosTypes';
import { ContractAbstraction, ContractProvider } from '@taquito/taquito';
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

export async function estimateCosts(recipient: string, amount: number) {
  const state = store.getState();
  return await state.net2client[state.network].estimate.transfer({ to: recipient, amount });
}

export async function estimateTokenTransferCosts(
  tokenType: TokenStandard,
  contractAddress: string,
  recipient: string,
  amount: string,
  decimals?: number,
  tokenId?: number
) {
  const state = store.getState();
  const client = state.net2client[state.network];
  const sender = await state.accounts[state.network].address;
  const contract: ContractAbstraction<ContractProvider> = await client.contract.at(contractAddress);

  let tx;
  if (tokenType === TokenStandard.FA1_2) {
    tx = await contract.methods.transfer(sender, recipient, amount).toTransferParams({});
  } else if (tokenType === TokenStandard.FA2) {
    if (decimals === undefined) throw new Error('decimals is undefined');
    if (tokenId === undefined) throw new Error('tokenId is undefined');
    const transferParam = [
      {
        from_: sender,
        txs: [
          {
            amount: new BigNumber(amount).multipliedBy(new BigNumber(10).pow(new BigNumber(decimals))),
            to_: recipient,
            token_id: tokenId
          }
        ]
      }
    ];
    tx = await contract.methods.transfer(transferParam).toTransferParams({});
  }

  return await client.estimate.transfer(tx);
}

export async function transferTezos(
  recipient: string,
  amount: number,
  afterDeploymentCallback?: Function,
  afterConfirmationCallback?: Function
): Promise<void> {
  const state = store.getState();

  let op: TransactionOperation;
  let notificationId;
  try {
    op = await state.net2client[state.network].contract.transfer({
      to: recipient,
      amount: amount
    });
    if (afterDeploymentCallback) {
      afterDeploymentCallback();
    }
    notificationId = addPermanentNotification('Transaction was sent successfully: ' + op.hash);
  } catch (e) {
    console.warn(e);
    throw e;
  }
  op.confirmation(1)
    .then(() => {
      addNotification('success', 'Transaction completed successfully');
    })
    .catch((e) => {
      addNotification('danger', 'Transaction failed');
    })
    .finally(() => {
      removeNotification(notificationId);
      if (afterConfirmationCallback) {
        afterConfirmationCallback();
      }
    });
}

export async function transferToken(
  tokenType: TokenStandard,
  contractAddress: string,
  recipient: string,
  amount: string,
  afterDeploymentCallback?: Function,
  afterConfirmationCallback?: Function,
  decimals?: number,
  tokenId?: number
) {
  const state = store.getState();
  const sender = await state.accounts[state.network].address;
  const contract: ContractAbstraction<ContractProvider> = await state.net2client[state.network].contract.at(
    contractAddress
  );

  let tx;

  if (tokenType === TokenStandard.FA1_2) {
    tx = await contract.methods.transfer(sender, recipient, amount);
  } else if (tokenType === TokenStandard.FA2) {
    if (decimals === undefined) throw new Error('decimals is undefined');
    if (tokenId === undefined) throw new Error('tokenId is undefined');
    const transferParam = [
      {
        from_: sender,
        txs: [
          {
            amount: new BigNumber(amount).multipliedBy(new BigNumber(10).pow(new BigNumber(decimals))),
            to_: recipient,
            token_id: tokenId
          }
        ]
      }
    ];
    tx = await contract.methods.transfer(transferParam);
  }

  let op: TransactionOperation;
  let notificationId;
  try {
    op = await tx.send();
    if (afterDeploymentCallback) {
      afterDeploymentCallback();
    }
    notificationId = addPermanentNotification('Transaction was sent successfully: ' + op.hash);
  } catch (e) {
    throw e;
  }
  op.confirmation(1)
    .then(() => {
      addNotification('success', 'Transaction completed successfully');
    })
    .catch((e) => {
      addNotification('danger', 'Transaction failed');
    })
    .finally(() => {
      removeNotification(notificationId);
      if (afterConfirmationCallback) {
        afterConfirmationCallback();
      }
    });
}

export async function modifyWhitelist(
  version: WhitelistVersion,
  contractAddress: string,
  address: string,
  add: boolean,
  afterDeploymentCallback?: Function,
  afterConfirmationCallback?: Function
) {
  if (version === WhitelistVersion.V0) {
    // input validation
    const state = store.getState();
    const contract: ContractAbstraction<ContractProvider> = await state.net2client[state.network].contract.at(
      contractAddress
    );

    let whitelistParam = add
      ? [
          {
            add_whitelisted: address
          }
        ]
      : [
          {
            remove_whitelisted: address
          }
        ];

    let op: TransactionOperation;
    let notificationId;
    try {
      op = await contract.methods.update_whitelisteds(whitelistParam).send();
      if (afterDeploymentCallback) {
        afterDeploymentCallback();
      }
      notificationId = addPermanentNotification('Transaction was sent successfully: ' + op.hash);
    } catch (e) {
      throw e;
    }
    op.confirmation(1)
      .then(() => {
        addNotification('success', 'Transaction completed successfully');
      })
      .catch((e) => {
        addNotification('danger', 'Transaction failed');
      })
      .finally(() => {
        removeNotification(notificationId);
        if (afterConfirmationCallback) {
          afterConfirmationCallback();
        }
      });
  } else {
    throw new Error('Unsupported whitelist version');
  }
}

export async function modifyWhitelistAdmin(
  version: WhitelistVersion,
  contractAddress: string,
  address: string,
  add: boolean,
  afterDeploymentCallback?: Function,
  afterConfirmationCallback?: Function
) {
  if (version === WhitelistVersion.V0) {
    // input validation
    const state = store.getState();
    const contract: ContractAbstraction<ContractProvider> = await state.net2client[state.network].contract.at(
      contractAddress
    );

    let whitelistAdminParam = add
      ? [
          {
            add_whitelister: address
          }
        ]
      : [
          {
            remove_whitelister: address
          }
        ];

    let op: TransactionOperation;
    let notificationId;
    try {
      op = await contract.methods.update_whitelisters(whitelistAdminParam).send();
      if (afterDeploymentCallback) {
        afterDeploymentCallback();
      }
      notificationId = addPermanentNotification('Transaction was sent successfully: ' + op.hash);
    } catch (e) {
      throw e;
    }
    op.confirmation(1)
      .then(() => {
        addNotification('success', 'Transaction completed successfully');
      })
      .catch((e) => {
        addNotification('danger', 'Transaction failed');
      })
      .finally(() => {
        removeNotification(notificationId);
        if (afterConfirmationCallback) {
          afterConfirmationCallback();
        }
      });
  } else {
    throw new Error('Unsupported whitelist version');
  }
}

export async function getContract(contractAddress: string) {
  if (!isContractAddress(contractAddress)) {
    return;
  }
  const state = store.getState();
  return await state.net2client[state.network].contract.at(contractAddress);
}

export async function getTokenData(contract: ContractAbstraction<ContractProvider>, tokenType: TokenStandard) {
  const storage: any = await contract.storage();
  if (tokenType === TokenStandard.FA2) {
    return await storage.token_metadata.get('0');
  } else if (tokenType === TokenStandard.FA1_2) {
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
  if (tokenType === TokenStandard.FA2) {
    const token_metadata = await storage.token_metadata.get('0');
    const balance: BigNumber = (await storage.ledger.get(holderAddress))?.balance ?? new BigNumber(0);
    const adjustedBalance = balance.dividedBy(new BigNumber(10).pow(token_metadata.decimals));

    return adjustedBalance.toFixed();
  } else if (tokenType === TokenStandard.FA1_2) {
    const ledgerEntry = await storage.ledger.get(holderAddress);
    return ledgerEntry.balance.toFixed();
  } else {
    throw new Error('not implemented');
  }
}

export function deployToken(
  tokenStandard: TokenStandard,
  whitelist: boolean,
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
  if (tokenStandard === TokenStandard.FA1_2) {
    if (whitelist) {
      byteCode = FA1_2_WHITELIST;
      storage = FA1_2_WHITELIST_STORAGE(issuedTo, amountIssued, issuedTo, issuedTo, issuedTo, issuedTo);
    } else {
      byteCode = FA1_2_BASIC;
      storage = FA1_2_BASIC_STORAGE(issuedTo, amountIssued);
    }
  } else if (tokenStandard === TokenStandard.FA2) {
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
    .then((op) => {
      const contractId = addPermanentNotification('The smart contract is deploying...');
      if (afterDeploymentCallback) {
        afterDeploymentCallback();
      }
      // get contract
      op.contract().then((contract) => {
        op.confirmation(1).then(() => {
          if (afterConfirmationCallback) {
            afterConfirmationCallback();
          }
          // remove pending contract deployment notification
          removeNotification(contractId);
          if (tokenStandard === TokenStandard.FA1_2) {
            // update redux store
            addTokenReduxCallback(state.network, contract.address, {
              type: TokenStandard.FA1_2,
              name: tokenName,
              symbol: tokenSymbol
            });
            addNotification('success', 'The token was added successfully');
          } else if (tokenStandard === TokenStandard.FA2) {
            const tokenId = addNotification('success', 'The smart contract deployed successfully, adding token...');
            getTokenData(contract, tokenStandard).then((fetchedTokenData) => {
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

export async function handleContractDeployment(
  byteCode: string,
  storage: string,
  afterDeploymentCallback?: Function,
  afterConfirmationCallback?: Function
) {
  // deploy contract
  const state = store.getState();
  const op = await state.net2client[state.network].contract.originate({
    code: JSON.parse(byteCode),
    init: JSON.parse(storage)
  });

  const notificationId = addPermanentNotification('The smart contract is deploying...');
  if (afterDeploymentCallback) {
    afterDeploymentCallback();
  }
  // get contract
  op.contract().then((contract) => {
    op.confirmation(1)
      .then(() => {
        addNotification('success', 'Transaction completed successfully');
        const url =
          'https://better-call.dev/' +
          (state.network === Net.Mainnet ? 'mainnet/' : 'carthagenet/') +
          op.contractAddress;
        window.open(url);
      })
      .catch((e) => {
        addNotification('danger', 'Transaction failed');
      })
      .finally(() => {
        removeNotification(notificationId);
        if (afterConfirmationCallback) {
          afterConfirmationCallback();
        }
      });
  });
}
