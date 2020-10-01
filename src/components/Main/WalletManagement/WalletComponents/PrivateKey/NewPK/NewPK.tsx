import React, { useState } from 'react';
import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner, importKey } from '@taquito/signer';
import Button from 'react-bootstrap/Button';
import { printPdf } from '../../../../../../helpers/walletPdf';
import { addNotification } from '../../../../../../shared/NotificationService';
import { Net, WalletTypes } from '../../../../../../shared/TezosTypes';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { generatePrivateKey } from '../../../../../../shared/TezosUtil';
import IconButton from '../../../../../shared/IconButton/IconButton';
import { FaCopy, FaDownload, FaPrint } from 'react-icons/fa';

interface INewPK {
  network: Net;
  addSigner: (address: string, signer: WalletTypes, wallet: boolean) => void;
}

export default function NewPK(props: INewPK) {
  const [privateKey, updatePrivateKey] = useState('');
  const [saveGuard, updateSaveGuard] = useState(false);

  const _handleCopy = () => {
    // send a notification that the key was copied successfully
    addNotification('success', 'Successfully copied key: ' + privateKey);
    // allow user to save the updates
    updateSaveGuard(true);
  };

  const handleCopy = (event: React.ClipboardEvent<HTMLSpanElement>) => {
    // when copying the span, set the copied data to the entire key
    event.clipboardData.setData('text/plain', privateKey);
    event.preventDefault();
    _handleCopy();
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
    updateSaveGuard(true);
  };

  const handleSave = async () => {
    // create signer from private key
    const signer = await InMemorySigner.fromSecretKey(privateKey);
    // get corresponding address
    const derivedAddress = await signer.publicKeyHash();
    // add the new signer and address to redux
    props.addSigner(derivedAddress, signer, false);
  };

  return (
    <div>
      {privateKey === '' ? (
        <div>
          <h4>Generate a private key</h4>
          <p>
            Pressing the button will create a new private key which you can then print, download or save to your
            clipboard.
          </p>
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
            To proceed, please copy, download or print the private key and store it somewhere safe. Caution, losing the
            key will result in a loss of funds!
          </p>
        </div>
      )}
      <hr />
      <Button className="float-right" disabled={!saveGuard} onClick={handleSave}>
        Save
      </Button>
    </div>
  );
}
