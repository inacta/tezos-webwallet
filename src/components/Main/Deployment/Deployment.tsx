import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import DeployTokenModal from './DeployTokenModal/DeployTokenModal';
import { EnumDictionary } from '../../../shared/AbstractTypes';
import { Net } from '../../../shared/TezosTypes';
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';
import DeploySmartContractModal from './DeploySmartContractModal/DeploySmartContractModal';

interface IDeployment {
  network: Net;
  accounts: EnumDictionary<Net, { address: string; signer?: InMemorySigner | TezBridgeSigner }>;
  net2client: EnumDictionary<Net, TezosToolkit>;
  addToken: (network: Net, address: string, token) => void;
}

export default function Deployment(props: IDeployment) {
  const [showTModal, updateTModal] = useState(false);
  const [showSCModal, updateSCModal] = useState(false);

  return (
    <>
      <Row className="mt-5">
        <Col>
          <h3>Deploy Tokens & Smart Contracts</h3>
        </Col>
      </Row>
      <Row>
        <Col sm="6" xs="12" className="mt-3">
          <Button block onClick={() => updateTModal(true)}>
            Deploy new Token
          </Button>
        </Col>
        <Col sm="6" xs="12" className="mt-3">
          <Button block onClick={() => updateSCModal(true)}>
            Deploy a smart contract
          </Button>
        </Col>
      </Row>
      <DeployTokenModal
        network={props.network}
        net2client={props.net2client}
        showModal={showTModal}
        updateModal={updateTModal}
        addToken={props.addToken}
        address={props.accounts[props.network].address}
      />
      <DeploySmartContractModal
        network={props.network}
        net2client={props.net2client}
        showModal={showSCModal}
        updateModal={updateSCModal}
      />
    </>
  );
}
