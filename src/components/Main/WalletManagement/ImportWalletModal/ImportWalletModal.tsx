import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { isValidSecretKey } from '../../../../shared/TezosService';
import { Net } from '../../../../shared/TezosTypes';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';

interface IImportWalletModal {
  show: boolean;
  network: Net;
  address: {
    [key: string]: string;
  };

  updateAddress: React.Dispatch<
    React.SetStateAction<{
      [key: string]: string;
    }>
  >;

  closeDialog: () => void;
  addPrivateKey: (address: string, network: Net, signer?: InMemorySigner | TezBridgeSigner) => void;
}

export default function ImportWalletModal(props: IImportWalletModal) {
  const defaultActiveKey = 'tezbridge';
  const [privateKey, updatePrivateKey] = useState('');
  const [keyError, updateKeyError] = useState('');
  const [activeKey, updateActiveKey] = useState(defaultActiveKey);
  const [saveGuard, updateSaveGuard] = useState({
    [defaultActiveKey]: false
  });

  const setGuardForCurrentTab = (allow: boolean) => {
    updateSaveGuard({
      ...saveGuard,
      [activeKey]: allow
    });
  };

  const handleSelect = (newKey: string) => {
    if (!saveGuard.hasOwnProperty(newKey)) {
      updateSaveGuard({
        ...saveGuard,
        [newKey]: false
      });
    }
    updateActiveKey(newKey);
  };

  const reset = () => {
    updatePrivateKey('');
    updateKeyError('');
    updateSaveGuard({
      [defaultActiveKey]: false
    });
  };

  const validateKey = (event) => {
    const formValue = event.currentTarget.value;
    updatePrivateKey(formValue);
    if (isValidSecretKey(formValue)) {
      updateKeyError('');
      setGuardForCurrentTab(true);
    } else {
      updateKeyError('Error: Invalid key');
      setGuardForCurrentTab(false);
    }
  };

  const handleSave = async () => {
    if (activeKey === 'privKey') {
      // create signer from private key
      const signer = await InMemorySigner.fromSecretKey(privateKey);
      // get corresponding address
      const derivedAddress = await signer.publicKeyHash();
      // add the new signer and address to redux
      props.addPrivateKey(derivedAddress, props.network, signer);
      // update the form field
      props.updateAddress({
        ...props.address,
        [props.network]: derivedAddress
      });
    } else if (activeKey === 'tezbridge') {
      // create signer for tezbridge
      const signer = new TezBridgeSigner();
      // let user enter choose an account
      const address = await signer.publicKeyHash();
      // add the new signer and address to redux
      props.addPrivateKey(address, props.network, signer);
      // update the form field
      props.updateAddress({
        ...props.address,
        [props.network]: address
      });
    }
    // close dialog
    props.closeDialog();
  };

  return (
    <Modal centered size="lg" show={props.show} onHide={props.closeDialog} onEntered={reset}>
      <Modal.Header closeButton>
        <Modal.Title>Import a wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Here you can import a Tezos Wallet. Please choose one of the methods below.</p>
        <div className="d-flex justify-content-between">
          <span className="text-muted">secure</span>
          <span className="text-muted">user friendly</span>
        </div>
        <div className="WalletManagement-gradientline mb-2"></div>
        <Tabs className="WalletManagement-navbar nav-justified" activeKey={activeKey} onSelect={handleSelect}>
          <Tab eventKey="file" title="Wallet File" className="mt-2">
            Coming soon...
          </Tab>
          <Tab eventKey="tezbridge" title="TezBridge" className="mt-2">
            <h3>TezBridge</h3>
            TezBride is a web based Tezos wallet. It allows to generate and import keys in plaintext, mnemonic phrases
            and even use a Ledger Nano hardware wallet. Be aware that TezBridge is not affiliated with Tokengate.{' '}
            <span className="text-danger">
              Be careful to backup any keys you generate with TezBridge. A loss of your keys will result in a loss of
              your funds!
            </span>
            <br />
            Click the button below to connect to TezBridge and choose an account you want to use.
          </Tab>
          <Tab eventKey="privKey" title="Private Key" className="mt-2">
            <div>
              <h3>Enter a private Key</h3>
              <Form>
                <Form.Group>
                  <Form.Control placeholder="Enter your private key here" onChange={validateKey} value={privateKey} />
                  <Form.Text className="text-danger">{keyError}</Form.Text>
                </Form.Group>
              </Form>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.closeDialog}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!saveGuard[activeKey] && activeKey !== 'tezbridge'}>
          <span>{activeKey === 'tezbridge' ? 'Connect to TezBridge' : 'Save'}</span>
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
