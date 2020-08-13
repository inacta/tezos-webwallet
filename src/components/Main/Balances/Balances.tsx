import React, { useEffect, useState } from 'react';
import { Net } from '../../../shared/TezosTypes';
import { EnumDictionary } from '../../../shared/AbstractTypes';
import { TezosToolkit } from '@taquito/taquito';
import configureStore from '../../../redux/store';
import { isContractAddress, getTokenData } from '../../../shared/TezosService';
import BigNumber from 'bignumber.js';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import FormText from 'react-bootstrap/FormText';
import Modal from 'react-bootstrap/Modal';
import Loading from '../../Loading/Loading';

const store = configureStore().store;

interface IBalancesProps {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  accounts: EnumDictionary<Net, { address: string; privKey: string }>;
  tokens: EnumDictionary<Net, Array<{ symbol: string; address: string }>>;
}

export default function Balances(props: IBalancesProps) {
  const [tokenModal, handleModal] = useState({
    show: false,
    new: false
  });
  const [balance, updateBalance] = useState('');
  const [tokenContract, updateContract] = useState({
    address: '',
    error: ''
  });

  const [tokenData, updateTokenData] = useState({
    name: '',
    symbol: '',
    decimals: new BigNumber(0),
    madeBy: '',
    developers: ''
  });

  const closeTokenDialog = () => {
    handleModal({
      ...tokenModal,
      show: false
    });
    updateTokenData({
      name: '',
      symbol: '',
      decimals: new BigNumber(0),
      madeBy: '',
      developers: ''
    });
    updateContract({
      address: '',
      error: ''
    });
  };

  const openTokenDialog = (newToken: boolean) => {
    if (newToken) {
      handleModal({
        show: true,
        new: true
      });
    } else {
      handleModal({
        show: true,
        new: false
      });
    }
  };

  const checkContractAddress = async (event) => {
    // get form value
    const formValue = event.currentTarget.value;

    if (formValue === '') {
      updateContract({
        address: '',
        error: ''
      });
      return;
    }
    if (!isContractAddress(formValue)) {
      updateContract({
        address: formValue,
        error: 'This is not a valid contract address'
      });
    } else {
      updateContract({
        address: formValue,
        error: ''
      });
      const fetchedTokenData = await getTokenData(props.net2client[props.network], formValue);
      updateTokenData({
        name: fetchedTokenData.name,
        symbol: fetchedTokenData.symbol,
        decimals: fetchedTokenData.decimals,
        madeBy: fetchedTokenData.extras.get('made by'),
        developers: fetchedTokenData.extras.get('developers')
      });
      console.log(tokenData);
      console.log(fetchedTokenData.extras.valueMap);
    }
  };

  const getTokenBalance = async (contractAddress: string, holderAddress: string) => {
    // If contract address is not a valid contract, don't attempt to look up the balance
    if (!isContractAddress(contractAddress)) {
      return;
    }
    const client = props.net2client[props.network];
    const contract = await client.contract.at(contractAddress);
    const storage: any = await contract.storage();
    const token_metadata = await storage.token_metadata.get('0');
    const balance: BigNumber = (await storage.ledger.get(holderAddress)).balance;
    const adjustedBalance = balance.dividedBy(new BigNumber(10).pow(token_metadata.decimals));

    console.log(contract);
    console.log(storage);
    console.log(token_metadata);
    console.log(balance.toString());
    console.log(adjustedBalance.toString());
  };

  useEffect(() => {
    checkContractAddress({
      currentTarget: {
        value: 'KT1JE97wUP7pmWRy7vKYHbuVoMnF9tcX4cY7'
      }
    });
    store.subscribe(async () => {
      const state = store.getState();
      console.log(state);
      const address = state.accounts[state.network].address;
      const client = state.net2client[state.network];
      if (address !== '') {
        updateBalance((await client.rpc.getBalance(address)).toString());
        const tokenContracts = state.tokens[state.network];
        console.log(tokenContracts);
        for (const contractAddress in tokenContracts) {
          console.log(contractAddress);
        }
        // tokenContracts.forEach(async (tokenContract) => {
        //   console.log(tokenContract.address);
        //   getTokenBalance(tokenContract.address, address);
        // });
      } else {
        updateBalance('');
      }
    });
    return function cleanup() {};
  }, []);

  return (
    <div>
      {props.accounts[props.network].address === '' ? (
        <div></div>
      ) : (
        <div>
          <br />
          <h3>Balances</h3>
          <p>{balance}</p>
          {props.tokens[props.network].length === 0 ? (
            <p>Add Tokens</p>
          ) : (
            <></>
            // <p>{JSON.stringify(props.tokens[props.network])}</p>
          )}
          <h4>Add a custom Token</h4>
          <p>You can add a custom token implemented under the FA2 standard here.</p>
          <InputGroup>
            <FormControl
              placeholder="Token Contract Address"
              onChange={checkContractAddress}
              value={tokenContract.address}
            />
            <InputGroup.Append>
              <Button
                variant="outline-primary"
                onClick={() => openTokenDialog(true)}
                disabled={tokenContract.error !== '' || tokenContract.address === ''}
              >
                Add Token
              </Button>
            </InputGroup.Append>
          </InputGroup>
          <FormText className="text-danger">{tokenContract.error}</FormText>
        </div>
      )}
      <Modal centered show={tokenModal.show} onHide={closeTokenDialog}>
        {tokenData.name === '' ? (
          <div>
            <Modal.Header closeButton>
              <Modal.Title>Loading Token Information...</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Loading />
            </Modal.Body>
          </div>
        ) : (
          <div>
            <Modal.Header closeButton>
              <Modal.Title>{tokenData.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                <b>Symbol: </b> {tokenData.symbol}
              </p>
              <p>
                <b>Decimals: </b> {tokenData.decimals.toString()}
              </p>
              <p>
                <b>Made by: </b> {tokenData.madeBy}
              </p>
              <p>
                <b>Developers: </b> {tokenData.developers}
              </p>
            </Modal.Body>
          </div>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={closeTokenDialog}>
            Close
          </Button>
          {tokenModal.new && tokenData.name !== '' ? (
            <Button variant="primary" onClick={closeTokenDialog}>
              Add Token
            </Button>
          ) : (
            <div></div>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
