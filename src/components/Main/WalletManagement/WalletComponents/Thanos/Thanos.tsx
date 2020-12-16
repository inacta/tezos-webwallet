import { Net, WalletTypes } from '../../../../../shared/TezosTypes';
import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { ThanosWallet } from '@thanos-wallet/dapp';
import WalletInfo from '../WalletInfo/WalletInfo';
import WarningTriangle from '../../../../shared/WarningTriangle/WarningTriangle';
import { addNotification } from '../../../../../shared/NotificationService';

interface IThanos {
  network: Net;
  addSigner: (address: string, network: Net, signer: WalletTypes, wallet: boolean) => void;
}

export default function Thanos(props: IThanos) {
  const [thanos, updateThanos] = useState(true);

  const thanosAvailable = async () => {
    updateThanos(await ThanosWallet.isAvailable());
  };

  useEffect(() => {
    thanosAvailable();
    return () => {};
  }, []);

  const handleSave = async () => {
    const available = await ThanosWallet.isAvailable();
    if (!available) {
      addNotification('danger', 'Please install the Thanos wallet');
      return;
    }
    const wallet = new ThanosWallet('MyXTZWallet');
    try {
      if (props.network === Net.Mainnet) {
        await wallet.connect('mainnet');
      } else if (props.network === Net.Testnet) {
        await wallet.connect('delphinet');
      } else {
        addNotification('danger', 'The network is currently not supported');
        return;
      }
    } catch (e) {
      console.error(e);
    }
    const address = await wallet.getPKH();
    // add signer and address to redux
    props.addSigner(address, props.network, wallet, true);
  };

  const text = `Thanos Wallet is an easy-to-use browser extension wallet for interacting with Tezos ecosystem,
    very similar to MetaMask for Ethereum.`;

  const procons = [
    { text: 'Keys are stored encrypted inside the browsers storage', pro: true },
    { text: 'Very user friendly', pro: true },
    {
      text: 'When switching computers or browsers, your accounts need to be imported into the wallet again',
      pro: false
    }
  ];

  return (
    <div>
      <hr />
      <h3>Thanos wallet</h3>
      <WalletInfo text={text} procons={procons} />
      {!thanos ? (
        <div className="warning-container">
          <WarningTriangle />
          <span>
            It seems like you do not have the Thanos wallet installed. You can download the browser extension{' '}
            <a href="https://thanoswallet.com/" target="_blank" rel="noopener noreferrer">
              here
            </a>
            . Make sure that DApp access is enabled in the settings!
          </span>
        </div>
      ) : (
        <></>
      )}
      <hr />
      <Button className="float-right" onClick={handleSave}>
        Connect to Thanos
      </Button>
    </div>
  );
}
