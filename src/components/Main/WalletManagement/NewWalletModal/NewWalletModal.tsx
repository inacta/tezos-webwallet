import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Button from 'react-bootstrap/Button';
import { FaCopy, FaDownload, FaPrint } from 'react-icons/fa';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { importKey, InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';
import { printPdf } from '../../../../helpers/walletPdf';
import { addNotification } from '../../../../shared/NotificationService';
import { generatePrivateKey } from '../../../../shared/TezosUtil';
import { Net, Wallets, WalletTypes } from '../../../../shared/TezosTypes';
import { TezosToolkit } from '@taquito/taquito';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import { LedgerSigner } from '@taquito/ledger-signer';
import IconButton from '../../../shared/IconButton/IconButton';

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
  addSigner: (address: string, network: Net, signer?: WalletTypes, wallet?: boolean) => void;
}

export default function NewWalletModal(props: INewWalletModal) {
  const defaultActiveKey = 'tezbridge';
  const [privateKey, updatePrivateKey] = useState('');
  const [activeKey, updateActiveKey] = useState<Wallets>(defaultActiveKey);
  const [saveGuard, updateSaveGuard] = useState({
    [defaultActiveKey]: false
  });

  const setGuardForCurrentTab = (allow: boolean) => {
    updateSaveGuard({
      ...saveGuard,
      [activeKey]: allow
    });
  };

  const handleSelect = (newKey: Wallets) => {
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
    _handleCopy();
  };

  const handleSave = async () => {
    if (activeKey === 'privKey') {
      // create signer from private key
      const signer = await InMemorySigner.fromSecretKey(privateKey);
      // get corresponding address
      const derivedAddress = await signer.publicKeyHash();
      // add the new signer and address to redux
      props.addSigner(derivedAddress, props.network, signer);
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
      props.addSigner(address, props.network, signer);
      // update the form field
      props.updateAddress({
        ...props.address,
        [props.network]: address
      });
    } else if (activeKey === 'ledger') {
      let signer;
      let address;
      try {
        const transport = await TransportU2F.create();
        signer = new LedgerSigner(transport);
        address = await signer.publicKeyHash();
      } catch (e) {
        console.error(e);
        addNotification(
          'danger',
          'Error while connecting to the device, please make sure that you enabled U2F in your browser.',
          10000
        );
        return;
      }
      // add signer and address to redux
      props.addSigner(address, props.network, signer);
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
    <Modal size="lg" show={props.show} onHide={props.closeDialog} onEntered={reset}>
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
          <Tab eventKey="ledger" title="Ledger Nano" className="mt-2">
            <h3>
              Ledger Nano hardware wallet <small className="text-danger">BETA</small>
            </h3>
            The Ledger Nano wallet is a USB storage wallet, which enables users to perform a wide variety of functions,
            including sending and receiving BTC, ETH, XTZ, etc. or running third-party apps on the device.
          </Tab>
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
                <CopyToClipboard text={privateKey} onCopy={_handleCopy}>
                  <IconButton onClick={() => {}} overlay="Copy">
                    <FaCopy />
                  </IconButton>
                </CopyToClipboard>
                <IconButton onClick={() => handlePrintDownload(true)} overlay="Download">
                  <FaDownload />
                </IconButton>
                <IconButton onClick={() => handlePrintDownload(false)} overlay="Print">
                  <FaPrint />
                </IconButton>
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
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!saveGuard[activeKey] && activeKey !== 'tezbridge' && activeKey !== 'ledger'}
        >
          <span>{activeKey === 'tezbridge' ? 'Connect to TezBridge' : 'Save'}</span>
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
