import React, { useEffect, useState, useCallback } from 'react';
import './Balances.scss';
import { Net } from '../../../shared/TezosTypes';
import { EnumDictionary } from '../../../shared/AbstractTypes';
import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import TokenModal from './TokenModal/TokenModal';
import TokenContractInput from './TokenContractInput/TokenContractInput';
import TezosBalance from './TezosBalance/TezosBalance';
import TokenSelection from './TokenSelection/TokenSelection';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';
import { addNotification } from '../../../shared/NotificationService';

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

  const getBalance = useCallback(async () => {
    const client = props.net2client[props.network];
    const address = props.accounts[props.network].address;
    client.rpc
      .getBalance(address)
      .then((fetchedBalance) => {
        updateBalance(fetchedBalance.dividedBy(new BigNumber(10).pow(6)).toString());
      })
      .catch((e) => {
        if (e.name === 'HttpRequestFailed') {
          addNotification(
            'danger',
            'The Tezos node seems to be offline. You can set another node or API provider in the settings.',
            10000
          );
        }
      });
  }, [props]);

  useEffect(() => {
    if (props.accounts[props.network].address !== '') {
      getBalance();
    } else {
      updateBalance('');
    }
    return function cleanup() {};
  }, [props, getBalance]);

  return (
    <>
      {props.accounts[props.network].address === '' ? (
        <></>
      ) : (
        <>
          <Row className="mt-5">
            <Col sm="12" md="4">
              <TezosBalance
                balance={balance}
                balanceCallback={getBalance}
                showTransfer={props.accounts[props.network].signer !== undefined}
              />
            </Col>
            <Col sm="12" md>
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
