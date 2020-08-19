// eslint-disable-next-line
import { b58cencode, Prefix, prefix, validateAddress, ValidationResult } from '@taquito/utils';
import { InMemorySigner } from '@taquito/signer';
import configureStore from '../redux/store';
import BigNumber from 'bignumber.js';
import { FA2_BASIC, FA2_BASIC_STORAGE } from './ContractAssembly';
import { addPermanentNotification, removeNotification, addNotification } from './NotificationService';
import { IExtraData } from './TezosTypes';

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

export const CONTRACT_ADDRESS_PREFIX = 'KT1';

export function isContractAddress(address: string) {
  if (!address || address.length < 3) {
    return false;
  }

  // A valid contract address starts with 'KT1'
  return address.substring(0, 3) === CONTRACT_ADDRESS_PREFIX && validateAddress(address) === ValidationResult.VALID;
}

export async function getTokenData(contractAddress: string) {
  if (!isContractAddress(contractAddress)) {
    return;
  }
  const state = store.getState();
  const contract = await state.net2client[state.network].contract.at(contractAddress);
  const storage: any = await contract.storage();
  return await storage.token_metadata.get('0');
}

export function convertMap(map: Map<string, string>): Object {
  return [...map.entries()].reduce((obj, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
}

export async function getTokenBalance(contractAddress: string, holderAddress: string): Promise<string> {
  if (!isContractAddress(contractAddress)) {
    return;
  }
  const state = store.getState();
  const contract = await state.net2client[state.network].contract.at(contractAddress);
  const storage: any = await contract.storage();
  const token_metadata = await storage.token_metadata.get('0');
  const balance: BigNumber = (await storage.ledger.get(holderAddress)).balance;
  const adjustedBalance = balance.dividedBy(new BigNumber(10).pow(token_metadata.decimals));

  return adjustedBalance.toString();
}

export function deployToken(
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
  // replace values in storage binary
  let replacedStorage = FA2_BASIC_STORAGE.replace('DECIMALS', decimals);
  replacedStorage = replacedStorage.replace('ISSUED_TO', issuedTo);
  replacedStorage = replacedStorage.replace('AMOUNT_ISSUED', amountIssued);
  replacedStorage = replacedStorage.replace('TOKEN_NAME', tokenName);
  replacedStorage = replacedStorage.replace('TOKEN_SYMBOL', tokenSymbol);

  const convertedExtraData = [];
  for (const dataField of extraData) {
    convertedExtraData.push({ prim: 'Elt', args: [{ string: dataField.key }, { string: dataField.value }] });
  }
  replacedStorage = replacedStorage.replace('EXTRA_FIELDS', JSON.stringify(convertedExtraData));

  // deploy contract
  const state = store.getState();
  state.net2client[state.network].contract
    .originate({
      code: JSON.parse(FA2_BASIC),
      init: JSON.parse(replacedStorage)
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
          const tokenId = addNotification('success', 'The smart contract deployed successfully, adding token...');
          getTokenData(contract.address).then((fetchedTokenData) => {
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
        });
      });
    });
}
