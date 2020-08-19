import React, { useState } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import BigNumber from 'bignumber.js';
import { Net } from '../../../../shared/TezosTypes';
import Loading from '../../../Loading/Loading';
import { convertMap, getTokenData } from '../../../../shared/TezosService';
import { addNotification } from '../../../../shared/NotificationService';

export interface TokenData {
  address: string;
  token: { name: string; symbol: string; decimals: BigNumber; extras: Object };
}

interface ITokenModalProps {
  network: Net;
  tokenModal: {
    show: boolean;
    new: boolean;
    address: string;
  };
  addToken: (network: Net, address: string, token) => void;
  handleModal: React.Dispatch<
    React.SetStateAction<{
      show: boolean;
      new: boolean;
      address: string;
    }>
  >;
}

export default function TokenModal(props: ITokenModalProps) {
  const [tokenData, updateTokenData]: [TokenData, React.Dispatch<TokenData>] = useState(undefined);

  const onOpen = () => {
    getContractInfo();
  };

  const getContractInfo = async () => {
    const fetchedTokenData = await getTokenData(props.tokenModal.address);
    updateTokenData({
      address: props.tokenModal.address,
      token: {
        name: fetchedTokenData.name,
        symbol: fetchedTokenData.symbol,
        decimals: fetchedTokenData.decimals,
        extras: convertMap(fetchedTokenData.extras)
      }
    });
  };

  const hideModal = () => {
    updateTokenData(undefined);
    props.handleModal({
      show: false,
      new: false,
      address: ''
    });
  };

  const saveToken = () => {
    props.addToken(props.network, tokenData.address, tokenData.token);
    addNotification('success', 'Successfully added new token!');
    hideModal();
  };

  return (
    <Modal centered show={props.tokenModal.show} onHide={hideModal} onEntered={onOpen}>
      {tokenData === undefined ? (
        <div>
          <Modal.Header closeButton>
            <Modal.Title>Loading Token Information...</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Loading />
          </Modal.Body>
        </div>
      ) : (
        <div>
          <Modal.Header closeButton>
            <Modal.Title>{tokenData.token.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <b>Address: </b> {tokenData.address}
            </p>
            <p>
              <b>Symbol: </b> {tokenData.token.symbol}
            </p>
            <p>
              <b>Decimals: </b> {tokenData.token.decimals.toString()}
            </p>
            {Object.keys(tokenData.token.extras).length !== 0 ? (
              <Accordion>
                <Card>
                  <Accordion.Toggle as={Card.Header} eventKey="0" style={{ cursor: 'pointer' }}>
                    Show additional information
                  </Accordion.Toggle>
                  <Accordion.Collapse eventKey="0">
                    <Card.Body>
                      {Object.keys(tokenData.token.extras).map((key, i) => {
                        return (
                          <p key={i}>
                            {/* Capitalize first letter */}
                            <b>{key}: </b>
                            {tokenData.token.extras[key]}
                          </p>
                        );
                      })}
                    </Card.Body>
                  </Accordion.Collapse>
                </Card>
              </Accordion>
            ) : (
              <div></div>
            )}
          </Modal.Body>
        </div>
      )}
      <Modal.Footer>
        <Button variant="secondary" onClick={hideModal}>
          Close
        </Button>
        {props.tokenModal.new && tokenData !== undefined ? (
          <Button variant="primary" onClick={saveToken}>
            Add Token
          </Button>
        ) : (
          <div></div>
        )}
      </Modal.Footer>
    </Modal>
  );
}
