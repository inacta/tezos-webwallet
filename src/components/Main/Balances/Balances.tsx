import React, { useEffect, useState } from 'react';
import './Balances.scss';
import { Net } from '../../../shared/TezosTypes';
import { EnumDictionary } from '../../../shared/AbstractTypes';
import { TezosToolkit } from '@taquito/taquito';
import configureStore from '../../../redux/store';
import { getTokenBalance } from '../../../shared/TezosService';
import BigNumber from 'bignumber.js';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import TokenModal from './TokenModal/TokenModal';
import TokenContractInput from './TokenContractInput/TokenContractInput';
import TezosBalance from './TezosBalance/TezosBalance';
import TokenBalances from './TokenBalances/TokenBalances';
import TokenSelection from './TokenSelection/TokenSelection';

const store = configureStore().store;

interface IBalancesProps {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  accounts: EnumDictionary<Net, { address: string; privKey: string }>;
  tokens: EnumDictionary<Net, Array<{ symbol: string; address: string }>>;

  addToken: (network: Net, address: string, token) => void;
  removeToken: (network: Net, address: string) => void;
}

export default function Balances(props: IBalancesProps) {
  const [balance, updateBalance] = useState('');

  const [tokenModal, handleModal] = useState({
    show: false,
    new: false,
    address: ''
  });

  const [tokenBalances, updateTokenbalances] = useState([]);

  useEffect(() => {
    // when the component is loaded, get the tezos balance and token balances of the address
    store.subscribe(async () => {
      // get current state
      const state = store.getState();
      const address = state.accounts[state.network].address;
      const client = state.net2client[state.network];
      const tokenContracts = state.tokens[state.network];
      if (address !== '') {
        // update Tezos balance
        updateBalance((await client.rpc.getBalance(address)).dividedBy(new BigNumber(10).pow(6)).toString());
        // update Balances
        updateTokenbalances([]);
        for (const contractAddress in tokenContracts) {
          const tokenBalance = await getTokenBalance(contractAddress, address);
          updateTokenbalances((oldArray) => [
            ...oldArray,
            {
              name: tokenContracts[contractAddress].name,
              symbol: tokenContracts[contractAddress].symbol,
              amount: tokenBalance
            }
          ]);
        }
      } else {
        updateBalance('');
      }
    });
    return function cleanup() {};
  }, []);

  return (
    <>
      {props.accounts[props.network].address === '' ? (
        <></>
      ) : (
        <>
          <Row className="mt-3">
            {/* TEZOS BALANCE */}
            <Col sm="12" md="auto" className="mt-4">
              <TezosBalance balance={balance} />
            </Col>
            {/* TOKEN BALANCES */}
            <Col sm="12" md="4" className="mt-4">
              <TokenBalances tokenBalances={tokenBalances}></TokenBalances>
            </Col>
            {/* TOKEN SELECTION */}
            <Col sm="12" md className="mt-4">
              <TokenSelection
                network={props.network}
                tokens={props.tokens}
                removeToken={props.removeToken}
                handleModal={handleModal}
              />
            </Col>
          </Row>
          <TokenContractInput handleModal={handleModal} />
        </>
      )}
      <TokenModal
        addToken={props.addToken}
        network={props.network}
        tokenModal={tokenModal}
        handleModal={handleModal}
      ></TokenModal>
    </>
  );
}
