import { TezBridgeSigner } from '@taquito/tezbridge-signer';
import React from 'react';
import Button from 'react-bootstrap/Button';
import { WalletTypes } from '../../../../../shared/TezosTypes';
import WalletInfo from '../WalletInfo/WalletInfo';

interface ITezBridge {
  addSigner: (address: string, signer: WalletTypes, wallet: boolean) => void;
}

export default function TezBridge(props: ITezBridge) {
  const handleSave = async () => {
    // create signer for tezbridge
    const signer = new TezBridgeSigner();
    // let user enter choose an account
    const address = await signer.publicKeyHash();
    // add the new signer and address to redux
    props.addSigner(address, signer, false);
  };

  const text = `TezBride is a web based Tezos wallet.
    It allows to generate and import keys in plaintext, mnemonic phrases and even use a Ledger Nano hardware wallet.
    This wallet is not suited for beginners, only use this method if you know what you are doing!`;

  const procons = [
    { text: 'Keys are stored encrypted inside the browsers storage', pro: true },
    { text: 'No installation of additional software required', pro: true },
    { text: 'Confusing user experience for beginners', pro: false },
    {
      text: 'When switching computers or browsers, your accounts need to be imported into the wallet again',
      pro: false
    }
  ];

  return (
    <div>
      <hr />
      <h3>TezBridge</h3>
      <WalletInfo text={text} procons={procons} />
      <hr />
      <Button className="float-right" onClick={handleSave}>
        Connect to TezBridge
      </Button>
    </div>
  );
}
