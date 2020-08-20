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
import TokenSelection from './TokenSelection/TokenSelection';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';

const store = configureStore().store;

interface IBalancesProps {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  accounts: EnumDictionary<Net, { address: string; signer?: InMemorySigner | TezBridgeSigner }>;
  tokens: EnumDictionary<Net, Array<{ symbol: string; address: string }>>;

  addToken: (network: Net, address: string, token) => void;
  removeToken: (network: Net, address: string) => void;
}

export default function Balances(props: IBalancesProps) {
  const [balance, updateBalance] = useState('');

  const [tokenModal, handleModal] = useState({
    show: false,
    address: ''
  });

  useEffect(() => {
    // when the component is loaded, get the tezos balance and token balances of the address
    store.subscribe(async () => {
      // get current state
      const state = store.getState();
      const address = state.accounts[state.network].address;
      const client = state.net2client[state.network];
      if (address !== '') {
        // update Tezos balance
        updateBalance((await client.rpc.getBalance(address)).dividedBy(new BigNumber(10).pow(6)).toString());
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
            <Col sm="12" md="4" className="mt-4">
              <TezosBalance balance={balance} />
            </Col>
            <Col sm="12" md className="mt-4">
              <TokenSelection network={props.network} tokens={props.tokens} removeToken={props.removeToken} />
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
