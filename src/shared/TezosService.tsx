/* eslint-disable */
import { b58decode, Prefix, prefix, validateAddress, ValidationResult } from '@taquito/utils';
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
import { IExtraData, Net, TokenStandard, WhitelistVersion, WalletTypes } from './TezosTypes';
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
import { InMemorySigner } from '@taquito/signer';

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

// Convert an integer to a byte array following the
// Tezos serialization standard
function packInteger(input: BigNumber) {
  if (!(input instanceof BigNumber)) {
      throw Error("Input must be of type BigNumber");
  }

  let binaryString = input.toString(2);
  var pad = 6;
  if ((binaryString.length - 6) % 7 === 0) {
      pad = binaryString.length;
  } else if (binaryString.length > 6) {
      pad = binaryString.length + 7 - (binaryString.length - 6) % 7;
  }

  binaryString = binaryString.padStart(pad, '0');

  var septets = [];
  for (let i = 0; i <= Math.floor(pad / 7); i++) {
      const val = binaryString.substring(7 * i, 7 * i + Math.min(7, pad - 7 * i));
      septets.push(val);
  }

  septets = septets.reverse();
  septets[0] = (input.isGreaterThanOrEqualTo(new BigNumber(0)) ? "0" : "1") + septets[0]

  var res = new Uint8Array(septets.length + 1);
  for (let i = 0; i < septets.length; i++) {
      var prefix = i == septets.length - 1 ? "0" : "1";
      res[i + 1] = parseInt(prefix + septets[i], 2);
  }

  // Add type indication for integer = 0x00
  res[0] = 0;

  return res;
}

// $ ligo interpret -s pascaligo 'Bytes.pack(set [1])' 0502000000020001
function packIntegerSet(input: BigNumber[]) {
  if (!(Array.isArray(input))) {
      throw Error("Input must be of type array");
  }

  // Sort integers since activities are stored as set(nat), and set is sorted internally
  // This means that the hash preimage is generated from a sorted sequence of integers, and
  // that must be reflected here
  input.sort();

  const packedIntegers = input.map(x => packInteger(x));
  const lengthOfValues = packedIntegers.reduce((a, b) => a + b.length, 0);
  var res = new Uint8Array(lengthOfValues + 5);
  res[0] = 2; // indicates `sequence`

  // add size indication
  var SizeInHex = lengthOfValues.toString(16).padStart(8, '0');
  for (let i = 0; i < 4; i++) {
      res[i + 1] = parseInt(SizeInHex.substring(2 * i, 2 * i + 2), 16);
  }

  var offset = 5;
  for (let i = 0; i < packedIntegers.length; i++) {
      const packed = packedIntegers[i];
      res.set(packed, offset);
      offset += packed.length;
  }

  return res;
}

/**
* Return the byte array resulting from `PACK` on `PAIR (PAIR (PAIR <nonce> <minutes>) <activities>) <recipients>`
* of type PAIR (PAIR (PAIR nat nat) set(nat)) set(address)
* Bytes.pack((((nonce, signed_claim.minutes), signed_claim.activities), signed_claim.recipients));
*/
function packFourTupleAsLeftBalancedPairs(nonce: BigNumber, minutes: BigNumber, activities: BigNumber[], recipients: string[]) {

  // 0x050707070707070001000200030004
  // Input validation happens in these helper functions
  var noncePacked = packInteger(nonce);
  var minutesPacked = packInteger(minutes);
  var activitiesPacked = packIntegerSet(activities);
  var recipientsPacked = packAddressSet(recipients);

  // The 0x05 is the prefix for all return values from the `PACK` instruction
  // The 0x07 indicates the pair type constructor.
  var res = new Uint8Array(7 + noncePacked.length + minutesPacked.length + activitiesPacked.length + recipientsPacked.length);
  res[0] = 5;
  res[1] = 7;
  res[2] = 7;
  res[3] = 7;
  res[4] = 7;
  res[5] = 7;
  res[6] = 7;
  res.set(noncePacked, 7);
  res.set(minutesPacked, 7 + noncePacked.length);
  res.set(activitiesPacked, 7 + noncePacked.length + minutesPacked.length);
  res.set(recipientsPacked, 7 + noncePacked.length + minutesPacked.length + activitiesPacked.length);

  return res;
}

function packAddress(input: string) {
  if (!(typeof input === 'string' || input instanceof String)){
      throw Error("Input address must be of type string");
  }

  if (validateAddress(input) !== ValidationResult.VALID){
      throw Error("Input is not a valid address. Got: " + input);
  }

  var hex = b58decode(input);

  // 0a indicates byte array, the next four bytes indicate length
  // in bytes
  return toByteArray("0a00000016" + hex);
}

function packAddressSet(input: string[]) {
  if (!(Array.isArray(input))) {
      throw Error("Input must be of type array");
  }

  // Sort addresses, since set is represented as a sorted sequence internally in Michelson.
  // Cf. the documentation, addresses are compared (and thus sorted) lexicographically,
  // but implicit accounts (those that start with 'tz') are ordered before the originated
  // accounts (those accounts controlled by a smart contract).
  // https://michelson.nomadic-labs.com/#instr-COMPARE
  let originatedAccounts = input.filter(x => x.startsWith('KT1'));
  originatedAccounts.sort();
  let implicitAccounts = input.filter(x => x.startsWith('tz'));
  implicitAccounts.sort();
  const sortedAddresses = implicitAccounts.concat(originatedAccounts);

  const packedAddresses = sortedAddresses.map(x => packAddress(x));
  const lengthOfValues = packedAddresses.reduce((a, b) => a + b.length, 0);
  var res = new Uint8Array(lengthOfValues + 5);
  res[0] = 2; // indicates `sequence`

  // add size indication
  var SizeInHex = lengthOfValues.toString(16).padStart(8, '0');
  for (let i = 0; i < 4; i++) {
      res[i + 1] = parseInt(SizeInHex.substring(2 * i, 2 * i + 2), 16);
  }

  var offset = 5;
  for (let i = 0; i < packedAddresses.length; i++) {
      const packed = packedAddresses[i];
      res.set(packed, offset);
      offset += packed.length;
  }

  return res;
}

function toHexString(byteArray) {
  return Array.prototype.map.call(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function toByteArray(hexString) {
  var result = new Uint8Array(hexString.length / 2);
  for (var i = 0; i < hexString.length; i += 2) {
    result[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }

  return result;
}

export async function arbitraryFunctionCall(
  contract: ContractAbstraction<ContractProvider>,
  functionName: string,
  argumentJsons: string[],
  afterDeploymentCallback?: Function,
  afterConfirmationCallback?: Function
) {
  // Parse the arguments which must all be valid JSON
  let args: any[];
  try {
    args = argumentJsons.map(x => JSON.parse(x));
  } catch (error) {
    console.log(error.message);
    return;
  }

  // define the function call made on the smart contract
  let tx;
  try {
    tx = await contract.methods[functionName](...args);
  } catch (error) {
    console.log(error.message);
    return;
  }

  // Publish transaction to blockchain
  const func = () => tx.send();
  await handleTx(func, afterDeploymentCallback, afterConfirmationCallback);
}

export async function registerTandemClaim(
  contractAddress: string,
  helpers: string[],
  minutes: number,
  activities: number[],
  afterDeploymentCallback?: Function,
  afterConfirmationCallback?: Function) {
  const state = store.getState();
  const tezos: TezosToolkit = state.net2client[state.network];
  const contract = await tezos.contract.at(contractAddress);
  const signer: WalletTypes = state.accounts[state.network].signer;

  // TODO: This will probably only work if "Private Key" method for handling the secret key is used
  // how do we get it to work for the other secret key storage methods?
  const inMemorySigner: InMemorySigner = signer as InMemorySigner;
  const signerAddress: string = await inMemorySigner.publicKeyHash();
  const signerPublicKey: string = await inMemorySigner.publicKey();
  const contractStorage: any = await contract.storage();

  let ownNonce: BigNumber;
  try {
    ownNonce = await contractStorage.nonces.get(signerAddress);

    // if no nonce was found and it is set to undefined, assume this means
    // that the field contains no nonces, so just set it to 0.
    if (typeof ownNonce === 'undefined' || ownNonce === null) {
      ownNonce = new BigNumber(0);
    }
  } catch (error) {
    ownNonce = new BigNumber(0);
  }

  const activitiesBN: BigNumber[] = activities.map(x => new BigNumber(x));
  const msgBytes = packFourTupleAsLeftBalancedPairs(ownNonce, new BigNumber(minutes), activitiesBN, helpers);
  const signature = await inMemorySigner.sign(toHexString(msgBytes));

  // We need to generate the signature, address and public key from the
  // wallet/signer object

  const tandemClaim = {
    helpers,
    activities,
    minutes,
    helpees: [{
        address: signerAddress,
        pk: signerPublicKey,
        signature: signature.sig,
    }],
  };
  let tx;
  try {
    tx = await contract.methods.register_tandem_claims([tandemClaim]);
  } catch (error) {
    console.log(error.message);
  }

  const func = () => tx.send();

  // Publish transaction to blockchain
  await handleTx(func, afterDeploymentCallback, afterConfirmationCallback);
}
