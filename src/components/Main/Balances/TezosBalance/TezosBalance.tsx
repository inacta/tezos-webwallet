import React from 'react';
import Loading from '../../../Loading/Loading';

interface ITezosBalance {
  balance: string;
}

export default function TezosBalance(props: ITezosBalance) {
  return (
    <>
      <h3>Balances</h3>
      {props.balance !== '' ? (
        <h5>
          {props.balance} <b>ꜩ</b>
        </h5>
      ) : (
        <Loading center={false}>Loading balances...</Loading>
      )}
    </>
  );
}
