import { ITokenDetails, Net } from '../../shared/TezosTypes';
import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { CallArbitraryEndpointModal } from './CallArbitraryEndpointModal';
import Col from 'react-bootstrap/Col';
import DeploySmartContractModal from './Deployment/DeploySmartContractModal/DeploySmartContractModal';
import DeployTokenModal from './Deployment/DeployTokenModal/DeployTokenModal';
import { EnumDictionary } from '../../shared/AbstractTypes';
import { IAccountState } from '../../redux/reducers/accounts';
import Row from 'react-bootstrap/Row';
import { TezosToolkit } from '@taquito/taquito';

interface IOtherActions {
  network: Net;
  accounts: IAccountState;
  net2client: EnumDictionary<Net, TezosToolkit>;
  addToken: (network: Net, address: string, token: ITokenDetails) => void;
}

export default function OtherActions(props: IOtherActions) {
  const [showTModal, updateTModal] = useState(false);
  const [showSCModal, updateSCModal] = useState(false);
  const [showArbFunCallModal, updateArbFunCallModal] = useState(false);

  return props.accounts[props.network].address === undefined ? (
    <></>
  ) : (
    <>
      <Row className="mt-5">
        <Col>
          <h3>Other Options</h3>
        </Col>
      </Row>
      <Row>
        <Col sm="4" xs="12" className="mt-3">
          <Button block onClick={() => updateTModal(true)}>
            Deploy new Token
          </Button>
        </Col>
        <Col sm="4" xs="12" className="mt-3">
          <Button block onClick={() => updateSCModal(true)}>
            Deploy a smart contract
          </Button>
        </Col>
        <Col sm="4" xs="12" className="mt-3">
          <Button block onClick={() => updateArbFunCallModal(true)}>
            Call function
          </Button>
        </Col>
      </Row>
      <DeployTokenModal
        network={props.network}
        net2client={props.net2client}
        showModal={showTModal}
        updateModal={updateTModal}
        addToken={props.addToken}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ownAddress={props.accounts[props.network].address!}
      />
      <DeploySmartContractModal
        network={props.network}
        net2client={props.net2client}
        showModal={showSCModal}
        updateModal={updateSCModal}
      />
      <CallArbitraryEndpointModal
        balanceCallback={undefined}
        hideModal={() => updateArbFunCallModal(false)}
        network={props.network}
        net2client={props.net2client}
        showModal={showArbFunCallModal}
      />
    </>
  );
}
