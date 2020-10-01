/* eslint-disable */
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
import {
  ContractAbstraction,
  ContractProvider,
  TezosToolkit,
  TransactionWalletOperation,
  Wallet
} from '@taquito/taquito';
import { TransactionOperation } from '@taquito/taquito/dist/types/operations/transaction-operation';
import { convertMap } from './Util';
import { getTxHash, isContractAddress, isWallet } from './TezosUtil';

const store = configureStore().store;

async function handleTx(func: Function, afterDeploymentCallback?: Function, afterConfirmationCallback?: Function) {
  let op: TransactionOperation | TransactionWalletOperation;
  let notificationId;
  try {
    op = await func();
    if (afterDeploymentCallback) {
      afterDeploymentCallback();
    }
    notificationId = addPermanentNotification('Transaction was sent successfully: ' + getTxHash(op));
  } catch (e) {
    console.error(e);
    throw e;
  }
  (op as TransactionOperation)
    .confirmation(1)
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

export async function estimateCosts(recipient: string, amount: number) {
  const state = store.getState();
  if (isWallet()) {
    return;
  }
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

  if (isWallet()) {
    return;
  }

  const sender = await state.accounts[state.network].address;
  const contract = (await client.contract.at(contractAddress)) as ContractAbstraction<ContractProvider>;

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
  const client = state.net2client[state.network];

  let func: Function;
  if (isWallet()) {
    func = () =>
      client.wallet
        .transfer({
          to: recipient,
          amount: amount
        })
        .send();
  } else {
    func = () =>
      client.contract.transfer({
        to: recipient,
        amount: amount
      });
  }

  handleTx(func, afterDeploymentCallback, afterConfirmationCallback);
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
  const contract = (await getContract(contractAddress)) as ContractAbstraction<ContractProvider>;

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

  const func = () => tx.send();
  handleTx(func, afterDeploymentCallback, afterConfirmationCallback);
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
    const contract = (await getContract(contractAddress)) as ContractAbstraction<ContractProvider>;

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

    const func = () => contract.methods.update_whitelisteds(whitelistParam).send();
    handleTx(func, afterDeploymentCallback, afterConfirmationCallback);
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
    const contract = (await getContract(contractAddress)) as ContractAbstraction<ContractProvider>;

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

    const func = () => contract.methods.update_whitelisters(whitelistAdminParam).send();
    handleTx(func, afterDeploymentCallback, afterConfirmationCallback);
  } else {
    throw new Error('Unsupported whitelist version');
  }
}

export async function getContract(contractAddress: string) {
  if (!isContractAddress(contractAddress)) {
    return;
  }
  const state = store.getState();
  let client: Wallet | ContractProvider;

  const wallet = isWallet();
  if (wallet) {
    client = state.net2client[state.network].wallet;
  } else {
    client = state.net2client[state.network].contract;
  }

  return await client.at(contractAddress);
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

export async function deployToken(
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

  const originationParams = {
    code: JSON.parse(byteCode),
    init: JSON.parse(storage)
  };
  // deploy contract
  const state = store.getState();
  let op;
  if (isWallet()) {
    op = await state.net2client[state.network].wallet.originate(originationParams).send();
  } else {
    op = state.net2client[state.network].contract.originate(originationParams);
  }
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
}

export async function handleContractDeployment(
  byteCode: string,
  storage: string,
  afterDeploymentCallback?: Function,
  afterConfirmationCallback?: Function
) {
  // deploy contract
  const state = store.getState();
  const originationParams = {
    code: JSON.parse(byteCode),
    init: JSON.parse(storage)
  };
  let op;
  if (isWallet()) {
    op = await state.net2client[state.network].wallet.originate(originationParams).send();
  } else {
    op = state.net2client[state.network].contract.originate(originationParams);
  }
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
