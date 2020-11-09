import './WalletIcons.scss';
import Col from 'react-bootstrap/Col';
import React from 'react';
import { Wallet } from '../../../../shared/TezosTypes';
import { getWalletSpec } from '../../../../shared/WalletUtil';

interface IWalletIcons {
  types: Wallet[];
  updateString: React.Dispatch<React.SetStateAction<string>>;
  onClick: React.Dispatch<React.SetStateAction<Wallet | undefined>>;
}

export default function WalletIcons(props: IWalletIcons) {
  return (
    <>
      {props.types.map((type: Wallet) => {
        const walletSpec = getWalletSpec(type);
        return (
          <Col
            key={type}
            md="auto"
            sm="auto"
            xs="auto"
            className="mb-3"
            onMouseEnter={() => props.updateString(walletSpec.name)}
            onMouseLeave={() => props.updateString('')}
            onClick={() => props.onClick(type)}
          >
            <div className="WalletIcon-image-container pointer d-flex justify-content-center align-items-center">
              {walletSpec.icon}
            </div>
          </Col>
        );
      })}
    </>
  );
}
