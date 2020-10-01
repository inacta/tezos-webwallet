import React, { useState } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import BigNumber from 'bignumber.js';
import { Net, TokenStandard, WhitelistVersion } from '../../../../shared/TezosTypes';
import Loading from '../../../shared/Loading/Loading';
import { getContract, getTokenData } from '../../../../shared/TezosService';
import { getContractInterface } from '../../../../shared/TezosUtil';
import { convertMap } from '../../../../shared/Util';
import { addNotification } from '../../../../shared/NotificationService';
import { ContractAbstraction, ContractProvider } from '@taquito/taquito';

export interface TokenData {
  address: string;
  token: {
    type: TokenStandard;
    name: string;
    symbol: string;
    whitelistVersion: WhitelistVersion;
    decimals?: BigNumber;
    extras?: Record<string, string>;
  };
}

interface ITokenModalProps {
  network: Net;
  tokenModal: {
    show: boolean;
    address: string;
  };
  addToken: (network: Net, address: string, token) => void;
  handleModal: React.Dispatch<
    React.SetStateAction<{
      show: boolean;
      address: string;
    }>
  >;
}

export default function TokenModal(props: ITokenModalProps) {
  const [tokenData, updateTokenData]: [TokenData, React.Dispatch<TokenData>] = useState(undefined);

  const hideModal = () => {
    updateTokenData(undefined);
    props.handleModal({
      show: false,
      address: ''
    });
  };

  const getContractInfo = async () => {
    const contract = (await getContract(props.tokenModal.address)) as ContractAbstraction<ContractProvider>;
    const contractInterface = getContractInterface(contract);
    const type = contractInterface[0];
    const methods = contractInterface[1];

    let whitelistVersion = WhitelistVersion.NO_WHITELIST;
    if (
      [
        'update_whitelisters',
        'update_whitelisteds',
        'set_non_revocable_wl_admin',
        'renounce_wl_admin',
        'add_wl_admin'
      ].every((mn) => methods.includes(mn))
    ) {
      whitelistVersion = WhitelistVersion.V0;
    }

    if (type === TokenStandard.FA2) {
      const fetchedTokenData = await getTokenData(contract, TokenStandard.FA2);
      updateTokenData({
        address: props.tokenModal.address,
        token: {
          type: TokenStandard.FA2,
          name: fetchedTokenData.name,
          symbol: fetchedTokenData.symbol,
          decimals: fetchedTokenData.decimals,
          extras: convertMap(fetchedTokenData.extras),
          whitelistVersion
        }
      });
    } else if (type === TokenStandard.FA1_2) {
      updateTokenData({
        address: props.tokenModal.address,
        token: {
          type: TokenStandard.FA1_2,
          name: '',
          symbol: '',
          whitelistVersion
        }
      });
    } else {
      addNotification('danger', 'Unsupported token type');
      hideModal();
    }
  };

  const onOpen = () => {
    getContractInfo();
  };

  const updateName = (event: React.ChangeEvent<HTMLInputElement>) => {
    let formValue = event.currentTarget.value;
    updateTokenData({
      ...tokenData,
      token: {
        ...tokenData.token,
        name: formValue
      }
    });
  };

  const updateSymbol = (event: React.ChangeEvent<HTMLInputElement>) => {
    let formValue = event.currentTarget.value;
    updateTokenData({
      ...tokenData,
      token: {
        ...tokenData.token,
        symbol: formValue
      }
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
          {tokenData.token.type === TokenStandard.FA1_2 ? (
            <>
              <Modal.Header closeButton>
                <Modal.Title>Import FA1.2 Token</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>
                  <b>Address: </b> {tokenData.address}
                </p>

                <Form>
                  <Form.Row>
                    <Form.Group as={Col} md controlId="name">
                      <Form.Label>Token name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Token name"
                        value={tokenData.token.name}
                        onChange={updateName}
                        required
                      />
                    </Form.Group>
                    <Form.Group as={Col} md controlId="symbol">
                      <Form.Label>Token symbol</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Token symbol"
                        value={tokenData.token.symbol}
                        onChange={updateSymbol}
                        required
                      />
                    </Form.Group>
                  </Form.Row>
                </Form>
              </Modal.Body>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
      <Modal.Footer>
        <Button variant="secondary" onClick={hideModal}>
          Close
        </Button>
        {tokenData !== undefined ? (
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
