import React from 'react';
import Badge from 'react-bootstrap/Badge';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { FaMinusCircle } from 'react-icons/fa';
import { Net } from '../../../../shared/TezosTypes';
import { EnumDictionary } from '../../../../shared/AbstractTypes';

interface ITokenSelection {
  network: Net;
  tokens: EnumDictionary<Net, Array<{ symbol: string; address: string }>>;
  removeToken: (network: Net, address: string) => void;
  handleModal: React.Dispatch<
    React.SetStateAction<{
      show: boolean;
      new: boolean;
      address: string;
    }>
  >;
}

export default function TokenSelection(props: ITokenSelection) {
  return (
    <>
      {Object.keys(props.tokens[props.network]).length === 0 ? (
        <></>
      ) : (
        <>
          <h3>Your Tokens</h3>
          {Object.keys(props.tokens[props.network]).map((tokenAddress, i) => {
            return (
              <h4 key={i}>
                <Badge pill variant="primary" className="d-inline-flex justify-content-between align-items-center">
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip id={'tooltip-more-info-' + i}>More info</Tooltip>}
                  >
                    <span
                      className="mr-1 pointer"
                      onClick={() => props.handleModal({ show: true, new: false, address: tokenAddress })}
                    >
                      {props.tokens[props.network][tokenAddress].symbol}
                    </span>
                  </OverlayTrigger>
                  <button className="icon-button" onClick={() => props.removeToken(props.network, tokenAddress)}>
                    <div>
                      <FaMinusCircle className="text-light" aria-label="delete" />
                    </div>
                  </button>
                </Badge>
              </h4>
            );
          })}
        </>
      )}
    </>
  );
}
