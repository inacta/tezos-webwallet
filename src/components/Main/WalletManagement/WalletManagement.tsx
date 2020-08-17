import React, { useState, useEffect } from 'react';
import './WalletManagement.scss';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { FaCopy, FaDownload, FaPrint } from 'react-icons/fa';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { generatePrivateKey, isValidSecretKey, isContractAddress } from '../../../shared/TezosService';
import { store } from 'react-notifications-component';
import { Net } from '../../../shared/TezosTypes';
import { EnumDictionary } from '../../../shared/AbstractTypes';
import { importKey } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import { validateAddress, ValidationResult } from '@taquito/utils';
import { printPdf } from '../../../helpers/walletPdf';

interface IWalletManagementProps {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;

  changeAddress: (address: string, network: Net) => void;
  addPrivateKey: (privateKey: string, address: string, network: Net) => void;
  resetToolkit: (network: Net) => void;
}

export default function WalletManagement(props: IWalletManagementProps) {
  const [showModal, setShow] = useState({
    new: false,
    import: false
  });
  const [allowSave, setSave] = useState(false);
  const [privateKey, updatePrivateKey] = useState('');
  const [addressError, updateAddressError] = useState('');
  const [keyError, updateKeyError] = useState('');
  const [address, updateAddress] = useState({
    [Net.Mainnet]: '',
    [Net.Testnet]: ''
  });

  const handleShow = (newWallet: boolean) => {
    updatePrivateKey('');
    setSave(false);
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

  const handleCopy = (event: React.ClipboardEvent<HTMLSpanElement>) => {
    // when copying the span, set the copied data to the entire key
    event.clipboardData.setData('text/plain', privateKey);
    event.preventDefault();
    _handleCopy();
  };

  const handleSave = async () => {
    // reset existing toolkit (remove potential signer)
    props.resetToolkit(props.network);
    // import new key into toolkit
    await importKey(props.net2client[props.network], privateKey);
    // get the address from the key
    const derivedAddress = await props.net2client[props.network].signer.publicKeyHash();
    // add the new key and address to redux
    props.addPrivateKey(privateKey, derivedAddress, props.network);
    // update the form field
    updateAddress({
      ...address,
      [props.network]: derivedAddress
    });
    // close dialog
    closeDialog();
  };

  const _handleCopy = () => {
    // send a notification that the key was copied successfully
    store.addNotification({
      message: 'Successfully copied key: ' + privateKey,
      type: 'success',
      container: 'bottom-center',
      insert: 'top',
      animationIn: ['animated', 'fadeIn'],
      animationOut: ['animated', 'fadeOut'],
      dismiss: {
        duration: 3000,
        onScreen: true
      }
    });
    // allow user to save the updates
    setSave(true);
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
    setSave(true);
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

  const validateKey = (event) => {
    const formValue = event.currentTarget.value;
    updatePrivateKey(formValue);
    if (isValidSecretKey(formValue)) {
      updateKeyError('');
      setSave(true);
    } else {
      updateKeyError('Error: Invalid key');
      setSave(false);
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
      {/* Modal New Wallet */}
      <Modal centered size="lg" show={showModal.new} onHide={closeDialog}>
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
          <Tabs defaultActiveKey="privKey" className="WalletManagement-navbar nav-justified">
            <Tab eventKey="file" title="Wallet File" className="mt-2">
              Coming soon...
            </Tab>
            <Tab eventKey="mnemonic" title="Mnemonic Phrase" className="mt-2">
              Coming soon...
            </Tab>
            <Tab eventKey="privKey" title="Private Key" className="mt-2">
              {privateKey === '' ? (
                <div>
                  <h3>Generate a private key</h3>
                  <p>This will create a new private key which you can then download or save to your clipboard.</p>
                  <Button variant="outline-primary" onClick={() => updatePrivateKey(generatePrivateKey())}>
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
          <Button variant="secondary" onClick={closeDialog}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!allowSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Import Wallet */}
      <Modal centered size="lg" show={showModal.import} onHide={closeDialog}>
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
          <Tabs defaultActiveKey="privKey" className="WalletManagement-navbar nav-justified">
            <Tab eventKey="ledger" title="Ledger Nano" className="mt-2">
              Coming soon...
            </Tab>
            <Tab eventKey="file" title="Wallet File" className="mt-2">
              Coming soon...
            </Tab>
            <Tab eventKey="mnemonic" title="Mnemonic Phrase" className="mt-2">
              Coming soon...
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
          <Button variant="secondary" onClick={closeDialog}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!allowSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
