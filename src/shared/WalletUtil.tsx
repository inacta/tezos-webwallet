import { FaEye, FaKey } from 'react-icons/fa';
import { Wallet, WalletSpec } from './TezosTypes';
import React from 'react';

function getImg(src: string) {
  return <img src={'/assets/img/' + src} alt={'logo-' + src} className="WalletIcon-image" />;
}

export function getWalletSpec(wallet: Wallet): WalletSpec {
  switch (wallet) {
    case Wallet.Ledger:
      return { name: 'Ledger Nano', icon: getImg('ledger.png') };
    case Wallet.Thanos:
      return { name: 'Thanos Wallet', icon: getImg('thanos.png') };
    case Wallet.AirGap:
      return { name: 'AirGap Wallet', icon: getImg('airgap.png') };
    case Wallet.TezBridge:
      return { name: 'TezBridge', icon: getImg('tezbridge.png') };
    case Wallet.PrivateKey:
      return { name: 'Private Key', icon: <FaKey /> };
    case Wallet.Address:
      return { name: 'View Address', icon: <FaEye /> };
    default:
      throw new Error('Wallet not supported');
  }
}
