import React, { useState } from 'react';
import Loading from '../../../Loading/Loading';
import TransferModal from './TransferModal/TransferModal';
import Button from 'react-bootstrap/Button';

interface ITezosBalance {
  balance: string;
  showTransfer: boolean;
  balanceCallback: () => void;
}

export default function TezosBalance(props: ITezosBalance) {
  const [showModal, updateModal] = useState(false);

  const hideModal = () => {
    updateModal(false);
  };

  return (
    <>
      <h3>Balance</h3>
      {props.balance !== '' ? (
        <>
          <h5>
            {props.balance} <b>ꜩ</b>
          </h5>
          <Button onClick={() => updateModal(true)}>Transfer</Button>
          {props.showTransfer ? (
            <TransferModal
              show={showModal}
              hideModal={hideModal}
              balance={props.balance}
              balanceCallback={props.balanceCallback}
            ></TransferModal>
          ) : (
            <></>
          )}
        </>
      ) : (
        <Loading center={false}>Loading balance...</Loading>
      )}
    </>
  );
}
