import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import FA2TransferModal from './FA2_TransferModal/FA2_TransferModal';
import { IKissDetails } from '../../../shared/KissTypes';
import { WhitelistVersion } from '../../../shared/TezosTypes';

interface IFA2_Component {
  address: string;
  contractAddress: string;
  token: { kissDetails?: IKissDetails; symbol: string; whitelistVersion?: WhitelistVersion };
  showTransfer: boolean;
}

export default function FA2Component(props: IFA2_Component) {
  const [showTransferModal, updateTransferModal] = useState(false);
  return (
    <div>
      <div>
        <h3>FA2 contract {props.contractAddress}</h3>
      </div>
      <div>
        <Button onClick={() => updateTransferModal(true)}>Transfer</Button>
        <br />
        <br />
        <FA2TransferModal
          ownAddress={props.address}
          show={showTransferModal}
          hideModal={() => updateTransferModal(false)}
          symbol={props.token.symbol}
          contractAddress={props.contractAddress}
        ></FA2TransferModal>
      </div>
    </div>
  );
}
