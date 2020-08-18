import React, { useState } from 'react';
import Row from 'react-bootstrap/esm/Row';
import Col from 'react-bootstrap/esm/Col';
import Button from 'react-bootstrap/esm/Button';
import DeployTokenModal from './DeployTokenModal/DeployTokenModal';
import { EnumDictionary } from '../../../shared/AbstractTypes';
import { Net } from '../../../shared/TezosTypes';
import { TezosToolkit } from '@taquito/taquito';

interface IDeployment {
  network: Net;
  accounts: EnumDictionary<Net, { address: string; privKey: string }>;
  net2client: EnumDictionary<Net, TezosToolkit>;
  addToken: (network: Net, address: string, token) => void;
}

export default function Deployment(props: IDeployment) {
  const [showModal, updateModal] = useState(false);

  return (
    <>
      <Row className="mt-4">
        <Col>
          <h3>Deploy Tokens & Smart Contracts</h3>
        </Col>
      </Row>
      <Row>
        <Col sm="6" xs="12" className="mt-3">
          <Button block onClick={() => updateModal(true)}>
            Deploy new FA2 Token
          </Button>
        </Col>
        <Col sm="6" xs="12" className="mt-3">
          <Button block>Deploy a smart contract</Button>
        </Col>
      </Row>
      <DeployTokenModal
        network={props.network}
        net2client={props.net2client}
        showModal={showModal}
        updateModal={updateModal}
        addToken={props.addToken}
        address={props.accounts[props.network].address}
      />
    </>
  );
}
