import React, { useEffect, useState } from 'react';
import Loading from '../../Loading/Loading';
import FA1_2TransferModal from './FA1_2TransferModal/FA1_2TransferModal';
import { getTokenData } from '../../../shared/TezosService';
import { TokenStandard } from '../../../shared/TezosTypes';
import { Button } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface IFA1_2Component {
  address: string;
  contractAddress: string;
  symbol: string;
  showTransfer: boolean;
}

export default function FA1_2Component(props: IFA1_2Component) {
  const [balance, updateBalance] = useState('');
  const [showModal, updateModal] = useState(false);
  const [whitelisted, updateWhitelisted] = useState(false);

  useEffect(() => {
    getTokenInfo();
    return () => {};
  }, []);

  const getTokenInfo = async () => {
    console.log(props.address);
    console.log(props.contractAddress);
    const data = await getTokenData(props.contractAddress, TokenStandard.fa1_2);
    const ledgerEntry = await data.ledger.get(props.address);
    updateWhitelisted(data.whitelisteds.includes(props.address));
    updateBalance(ledgerEntry.balance.toFixed());
  };

  return (
    <div>
      {balance !== '' ? (
        <div className="d-flex justify-content-between">
          <div>
            <h3>Balance</h3>
            <h5>
              {balance} <b>{props.symbol}</b>
            </h5>
            {props.showTransfer && whitelisted ? (
              <>
                <Button onClick={() => updateModal(true)}>Transfer</Button>
                <FA1_2TransferModal
                  show={showModal}
                  hideModal={() => updateModal(false)}
                  symbol={props.symbol}
                  balance={balance}
                  balanceCallback={getTokenInfo}
                ></FA1_2TransferModal>
              </>
            ) : (
              <></>
            )}
          </div>
          <div className="d-flex align-items-center">
            <h5>
              <span className="mr-2">Whitelist status</span>
              {whitelisted ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-danger" />}
            </h5>
          </div>
        </div>
      ) : (
        <Loading center={false}>Loading balance...</Loading>
      )}
    </div>
  );
}
