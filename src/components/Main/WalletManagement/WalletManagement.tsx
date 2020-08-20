import React, { useState } from 'react';
import './WalletManagement.scss';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { isContractAddress } from '../../../shared/TezosService';
import { Net } from '../../../shared/TezosTypes';
import { EnumDictionary } from '../../../shared/AbstractTypes';
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';
import { validateAddress, ValidationResult } from '@taquito/utils';
import NewWalletModal from './NewWalletModal/NewWalletModal';
import ImportWalletModal from './ImportWalletModal/ImportWalletModal';

interface IWalletManagementProps {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;

  changeAddress: (address: string, network: Net) => void;
  addPrivateKey: (address: string, network: Net, signer?: InMemorySigner | TezBridgeSigner) => void;
}

export default function WalletManagement(props: IWalletManagementProps) {
  const [showModal, setShow] = useState({
    new: false,
    import: false
  });
  const [addressError, updateAddressError] = useState('');
  const [address, updateAddress]: [
    { [key: string]: string },
    React.Dispatch<React.SetStateAction<{ [key: string]: string }>>
  ] = useState({
    [Net.Mainnet]: '',
    [Net.Testnet]: ''
  });

  const handleShow = (newWallet: boolean) => {
    if (newWallet) {
      setShow({
        new: true,
        import: false
      });
    } else {
      setShow({
        new: false,
        import: true
      });
    }
  };

  const closeDialog = () => {
    setShow({
      new: false,
      import: false
    });
  };

  const checkAddress = (event) => {
    // get form value
    const formValue = event.currentTarget.value;
    // update form field
    updateAddress({
      ...address,
      [props.network]: formValue
    });
    // if form value is empty, delete the address from redux
    if (formValue === '') {
      updateAddressError('');
      props.changeAddress(formValue, props.network);
      return;
    }
    // initiate address validation check
    const res = validateAddress(formValue);
    if (res === ValidationResult.NO_PREFIX_MATCHED) {
      updateAddressError('Invalid Address: no prefix matched');
    } else if (res === ValidationResult.INVALID_CHECKSUM) {
      updateAddressError('Invalid checksum');
    } else if (res === ValidationResult.INVALID_LENGTH) {
      updateAddressError('Invalid length');
    } else if (res === ValidationResult.VALID) {
      if (isContractAddress(formValue)) {
        updateAddressError('Contract address is not allowed');
      } else {
        // if address is valid, update redux storage
        updateAddressError('');
        props.changeAddress(formValue, props.network);
      }
    }
  };

  return (
    <div>
      <Row>
        <Col>
          <p>
            {props.network === Net.Mainnet
              ? 'You are using the mainnet, be careful when interacting with the blockchain to prevent the loss of funds.'
              : 'You are using the Carthage testnet.'}
          </p>
          <Form>
            <Form.Group>
              <Form.Control
                placeholder="Enter your address or add a wallet"
                onChange={checkAddress}
                value={address[props.network]}
              />
              <Form.Text className="text-danger">{addressError}</Form.Text>
            </Form.Group>
          </Form>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col>
          <Button onClick={() => handleShow(true)} block>
            New Wallet
          </Button>
        </Col>
        <Col>
          <Button onClick={() => handleShow(false)} block>
            Import Wallet
          </Button>
        </Col>
      </Row>
      <NewWalletModal
        show={showModal.new}
        network={props.network}
        address={address}
        closeDialog={closeDialog}
        addPrivateKey={props.addPrivateKey}
        updateAddress={updateAddress}
      ></NewWalletModal>
      <ImportWalletModal
        show={showModal.import}
        network={props.network}
        address={address}
        closeDialog={closeDialog}
        addPrivateKey={props.addPrivateKey}
        updateAddress={updateAddress}
      ></ImportWalletModal>
    </div>
  );
}
