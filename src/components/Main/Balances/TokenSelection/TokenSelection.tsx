import React from 'react';
import './TokenSelection.scss';
import Badge from 'react-bootstrap/Badge';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { FaMinusCircle } from 'react-icons/fa';
import { Net } from '../../../../shared/TezosTypes';
import { EnumDictionary } from '../../../../shared/AbstractTypes';
import { Link } from 'react-router-dom';
import IconButton from '../../../shared/IconButton/IconButton';

interface ITokenSelection {
  network: Net;
  tokens: EnumDictionary<Net, { symbol: string; address: string }[]>;
  removeToken: (network: Net, address: string) => void;
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
              <h4 key={i} className="d-inline mr-2">
                <Badge pill variant="primary" className="d-inline-flex justify-content-between align-items-center">
                  <Link to={'token/' + tokenAddress} className="TokenSelection-unstyled-link">
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip id={'tooltip-more-info-' + i}>More info</Tooltip>}
                    >
                      <span className="mr-1 pointer">{props.tokens[props.network][tokenAddress].symbol}</span>
                    </OverlayTrigger>
                  </Link>
                  <IconButton onClick={() => props.removeToken(props.network, tokenAddress)}>
                    <FaMinusCircle className="text-light" />
                  </IconButton>
                </Badge>
              </h4>
            );
          })}
        </>
      )}
    </>
  );
}
