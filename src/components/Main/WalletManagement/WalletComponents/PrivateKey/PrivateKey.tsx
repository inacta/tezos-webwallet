import { Net, WalletTypes } from '../../../../../shared/TezosTypes';
import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import ImportPK from './ImportPK/ImportPK';
import NewPK from './NewPK/NewPK';
import WalletInfo from '../WalletInfo/WalletInfo';

interface IPrivateKey {
  network: Net;
  addSigner: (address: string, signer: WalletTypes, wallet: boolean) => void;
}

export default function PrivateKey(props: IPrivateKey) {
  const [newWallet, updateNew] = useState(false);

  const text = `You can generate or import a private key to use with the web wallet.
    Using plain private keys is only recommended for development purposes!
    Using this wallet method for your funds leaves you vulnerable against attacks.`;

  const procons = [
    { text: 'Practical for development purposes', pro: true },
    { text: 'Very insecure', pro: false }
  ];

  return (
    <div>
      <hr />
      <div className="d-flex justify-content-between">
        <h3>Private Key</h3>
        <Button variant="secondary" className="mb-3" onClick={() => updateNew(!newWallet)}>
          {newWallet ? 'I already have a private key' : 'I want to generate a new private key'}
        </Button>
      </div>
      <WalletInfo text={text} procons={procons} />
      {newWallet ? (
        <NewPK addSigner={props.addSigner} network={props.network} />
      ) : (
        <ImportPK addSigner={props.addSigner} />
      )}
    </div>
  );
}
