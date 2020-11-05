import './AirGap.scss';
import { Net, WalletTypes } from '../../../../../shared/TezosTypes';
import React, { useEffect, useState } from 'react';
import { BeaconWallet } from '@taquito/beacon-wallet';
import Button from 'react-bootstrap/Button';
import { ThanosWallet } from '@thanos-wallet/dapp';
import WalletInfo from '../WalletInfo/WalletInfo';
import WarningTriangle from '../../../../shared/WarningTriangle/WarningTriangle';
import { addNotification } from '../../../../../shared/NotificationService';

interface IAirGap {
  network: Net;
  addSigner: (address: string, network: Net, signer: WalletTypes, wallet: boolean) => void;
}

export default function AirGap(props: IAirGap) {
  const [thanos, updateThanos] = useState(false);

  const thanosAvailable = async () => {
    updateThanos(await ThanosWallet.isAvailable());
  };

  useEffect(() => {
    thanosAvailable();
    return () => {};
  }, []);

  const handleSave = async () => {
    const options = {
      name: 'MyXTZWallet'
    };
    const wallet = new BeaconWallet(options);
    let net = {};
    if (props.network === Net.Mainnet) {
      net = { network: { type: 'mainnet' } };
    } else if (props.network === Net.Carthage) {
      net = { network: { type: 'carthagenet' } };
    } else {
      addNotification('danger', 'The network is currently not supported');
      return;
    }

    await wallet.requestPermissions(net);

    const address = await wallet.getPKH();
    // add signer and address to redux
    props.addSigner(address, props.network, wallet, true);
  };

  const text = `AirGap is a highly secure mobile wallet implementing the TZIP-10 standard for iOS and Android.
    It can also be used as a hardware wallet by installing the AirGap Vault on an old smart phone
    without any internet connection.`;

  const procons = [
    { text: 'Very secure, especially if paired with AirGap Vault', pro: true },
    { text: 'Supports many different assets', pro: true }
  ];

  return (
    <div>
      <hr />
      <h3>AirGap Mobile Wallet</h3>
      <WalletInfo text={text} procons={procons} />
      {thanos ? (
        <div className="warning-container">
          <WarningTriangle />
          Warning! A browser extension implementing the TZIP-10 wallet standard was detected (E.g. Thanos wallet). If
          you want to connect your AirGap wallet for the first time, please disable DApp support in the Settings of the
          extension.
        </div>
      ) : (
        <></>
      )}
      <hr />
      <Button className="float-right" onClick={handleSave}>
        Connect to AirGap
      </Button>
    </div>
  );
}
