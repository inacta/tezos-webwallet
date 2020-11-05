import React, { useState } from 'react';
import { AiOutlineReload } from 'react-icons/ai';
import Button from 'react-bootstrap/Button';
import IconButton from '../../../shared/IconButton/IconButton';
import Loading from '../../../shared/Loading/Loading';
import TransferModal from './TransferModal/TransferModal';

interface ITezosBalance {
  balance: string;
  showTransfer: boolean;
  balanceCallback: () => void;
}

export default function TezosBalance(props: ITezosBalance) {
  const [showModal, updateModal] = useState(false);
  const [numRotations, rotate] = useState(0);

  const hideModal = () => {
    updateModal(false);
  };

  const clickUpdateBalance = () => {
    rotate(numRotations + 1);
    props.balanceCallback();
  };

  return (
    <>
      <h3>Balance</h3>
      {props.balance !== '' ? (
        <>
          <h5>
            {props.balance} <b>ꜩ</b>
            <IconButton onClick={clickUpdateBalance} overlay="Reload balance" placement="right">
              <AiOutlineReload
                style={{ transform: `rotate(${numRotations * 360}deg)`, transition: 'all 0.75s ease-in-out' }}
              />
            </IconButton>
          </h5>
          {props.showTransfer ? (
            <>
              <Button onClick={() => updateModal(true)}>Transfer</Button>
              <TransferModal
                show={showModal}
                hideModal={hideModal}
                balance={props.balance}
                balanceCallback={props.balanceCallback}
              ></TransferModal>
            </>
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
