import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { LedgerSigner } from '@taquito/ledger-signer';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import WalletInfo from '../WalletInfo/WalletInfo';
import { WalletTypes } from '../../../../../shared/TezosTypes';
import WarningTriangle from '../../../../shared/WarningTriangle/WarningTriangle';
import { addNotification } from '../../../../../shared/NotificationService';

interface ILedgerNano {
  addSigner: (address: string, signer: WalletTypes, wallet: boolean) => void;
}

export default function LedgerNano(props: ILedgerNano) {
  const [u2f, updateU2F] = useState(true);

  const u2fAvailable = async () => {
    updateU2F(await TransportU2F.isSupported());
  };

  useEffect(() => {
    u2fAvailable();
    return () => {};
  }, []);

  const handleSave = async () => {
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
    props.addSigner(address, signer, false);
  };

  const text = `The Ledger Nano wallet is a USB storage wallet, which enables users to perform a wide variety of
    functions, including sending and receiving BTC, ETH, XTZ, etc. or running third-party apps on the device.`;

  const procons = [
    { text: 'Highly secure, even works reliably if the computer is infected with a virus', pro: true },
    { text: 'Supports many different assets and cryptocurrencies', pro: true },
    { text: 'Device required every time the account needs to be accessed', pro: false }
  ];

  return (
    <>
      <hr />
      <h3>
        Ledger Nano hardware wallet <small className="text-danger">BETA</small>
      </h3>
      <WalletInfo text={text} procons={procons}></WalletInfo>
      {!u2f ? (
        <div className="warning-container">
          <WarningTriangle />
          Please enable U2F support in your browser!
        </div>
      ) : (
        <></>
      )}
      <hr />
      <Button className="float-right" onClick={handleSave}>
        Connect to Ledger device
      </Button>
    </>
  );
}
