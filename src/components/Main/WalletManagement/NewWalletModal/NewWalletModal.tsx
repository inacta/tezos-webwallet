import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Button from 'react-bootstrap/Button';
import { FaCopy, FaDownload, FaPrint } from 'react-icons/fa';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { importKey, InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';
import { printPdf } from '../../../../helpers/walletPdf';
import { addNotification } from '../../../../shared/NotificationService';
import { generatePrivateKey } from '../../../../shared/TezosService';
import { Net } from '../../../../shared/TezosTypes';
import { TezosToolkit } from '@taquito/taquito';

interface INewWalletModal {
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

export default function NewWalletModal(props: INewWalletModal) {
  const defaultActiveKey = 'tezbridge';
  const [privateKey, updatePrivateKey] = useState('');
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
    updateSaveGuard({
      [defaultActiveKey]: false
    });
  };

  const handleCopy = (event: React.ClipboardEvent<HTMLSpanElement>) => {
    // when copying the span, set the copied data to the entire key
    event.clipboardData.setData('text/plain', privateKey);
    event.preventDefault();
    setGuardForCurrentTab(true);
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

  const _handleCopy = () => {
    // send a notification that the key was copied successfully
    addNotification('success', 'Successfully copied key: ' + privateKey);
    // allow user to save the updates
    setGuardForCurrentTab(true);
  };

  const handlePrintDownload = async (download: boolean) => {
    // Derive the address without setting the secret key on the Tezos object in state.
    const localTezosToolkit = new TezosToolkit();
    await importKey(localTezosToolkit, privateKey);
    const derivedAddress = await localTezosToolkit.signer.publicKeyHash();
    const pdf = printPdf(derivedAddress, props.network, privateKey);
    if (download) {
      pdf.download(`TezosSecretKeyFor${derivedAddress}.pdf`);
    } else {
      pdf.print({}, window.open('', '_blank'));
    }
    setGuardForCurrentTab(true);
  };

  return (
    <Modal centered size="lg" show={props.show} onHide={props.closeDialog} onEntered={reset}>
      <Modal.Header closeButton>
        <Modal.Title>Create a new wallet</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Here you can create a new Tezos Wallet. Please choose one of the methods below.</p>
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
            {privateKey === '' ? (
              <div>
                <h3>Generate a private key</h3>
                <p>This will create a new private key which you can then download or save to your clipboard.</p>
                <Button variant="primary" onClick={() => updatePrivateKey(generatePrivateKey())}>
                  Generate Private Key
                </Button>
              </div>
            ) : (
              <div>
                <h3>Your private key</h3>
                <span className="align-with-icon mr-1" onCopy={(e) => handleCopy(e)}>
                  {privateKey}
                </span>
                <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-copy">Copy</Tooltip>}>
                  <CopyToClipboard text={privateKey} onCopy={_handleCopy}>
                    <button className="icon-button">
                      <div>
                        <FaCopy aria-label="copy" />
                      </div>
                    </button>
                  </CopyToClipboard>
                </OverlayTrigger>
                <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-download">Download</Tooltip>}>
                  <button className="icon-button" onClick={() => handlePrintDownload(true)}>
                    <div>
                      <FaDownload aria-label="download file" />
                    </div>
                  </button>
                </OverlayTrigger>
                <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-print">Print</Tooltip>}>
                  <button className="icon-button" onClick={() => handlePrintDownload(false)}>
                    <div>
                      <FaPrint aria-label="print key" />
                    </div>
                  </button>
                </OverlayTrigger>
                <p className="text-danger">
                  To proceed, please copy, download or print the private key and store it somewhere safe. Caution,
                  losing the key will result in a loss of funds!
                </p>
              </div>
            )}
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
