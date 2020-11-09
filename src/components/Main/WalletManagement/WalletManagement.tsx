import './WalletManagement.scss';
import { Net, Wallet, WalletTypes } from '../../../shared/TezosTypes';
import React, { useState } from 'react';
import Address from './WalletComponents/Address/Address';
import AirGap from './WalletComponents/AirGap/AirGap';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import { EnumDictionary } from '../../../shared/AbstractTypes';
import { IAccountState } from '../../../redux/reducers/accounts';
import Ledger from './WalletComponents/LedgerNano/LedgerNano';
import PrivateKey from './WalletComponents/PrivateKey/PrivateKey';
import Row from 'react-bootstrap/Row';
import TezBridge from './WalletComponents/TezBridge/TezBridge';
import { TezosToolkit } from '@taquito/taquito';
import Thanos from './WalletComponents/Thanos/Thanos';
import WalletIcons from './WalletIcons/WalletIcons';
import { getWalletSpec } from '../../../shared/WalletUtil';

interface IWalletManagementProps {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  accounts: IAccountState;

  changeAddress: (address: string, network: Net) => void;
  addSigner: (address: string, network: Net, signer: WalletTypes, wallet: boolean) => void;
}

export default function WalletManagement(props: IWalletManagementProps) {
  const [hoverWallet, updateHoverWallet] = useState('');
  const [walletType, updateWallet] = useState<Wallet | undefined>(undefined);

  const addSigner = (address: string, signer: WalletTypes, wallet: boolean) => {
    props.addSigner(address, props.network, signer, wallet);
  };

  const changeAddress = (address: string) => {
    props.changeAddress(address, props.network);
  };

  const showWalletComponent = () => {
    switch (walletType) {
      case Wallet.Ledger:
        return <Ledger addSigner={addSigner} />;
      case Wallet.Thanos:
        return <Thanos network={props.network} addSigner={props.addSigner} />;
      case Wallet.AirGap:
        return <AirGap network={props.network} addSigner={props.addSigner} />;
      case Wallet.TezBridge:
        return <TezBridge addSigner={addSigner} />;
      case Wallet.PrivateKey:
        return <PrivateKey network={props.network} addSigner={addSigner} />;
      case Wallet.Address:
        return <Address changeAddress={changeAddress} />;
      default:
        return <></>;
    }
  };

  return (
    <div>
      <h2>Access your wallet</h2>
      <Card className="border-primary" body>
        <Container>
          <Row className="mb-2">
            <Col>
              <h3>
                {hoverWallet !== ''
                  ? hoverWallet
                  : walletType === undefined
                  ? 'Select a wallet type'
                  : getWalletSpec(walletType).name}
              </h3>
            </Col>
          </Row>
          <Row className="d-flex justify-content-between justify-content-md-start">
            <WalletIcons
              types={[Wallet.Ledger, Wallet.AirGap, Wallet.Thanos, Wallet.TezBridge, Wallet.PrivateKey, Wallet.Address]}
              updateString={updateHoverWallet}
              onClick={updateWallet}
            />
          </Row>
          {walletType !== undefined ? showWalletComponent() : <></>}
        </Container>
      </Card>
    </div>
  );
}
