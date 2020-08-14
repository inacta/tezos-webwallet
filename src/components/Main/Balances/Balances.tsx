import React, { useEffect, useState } from 'react';
import './Balances.scss';
import { Net } from '../../../shared/TezosTypes';
import { EnumDictionary } from '../../../shared/AbstractTypes';
import { TezosToolkit } from '@taquito/taquito';
import configureStore from '../../../redux/store';
import { isContractAddress, getTokenData } from '../../../shared/TezosService';
import { FaMinusCircle } from 'react-icons/fa';
import BigNumber from 'bignumber.js';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import FormText from 'react-bootstrap/FormText';
import Modal from 'react-bootstrap/Modal';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Loading from '../../Loading/Loading';

const store = configureStore().store;

interface IBalancesProps {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  accounts: EnumDictionary<Net, { address: string; privKey: string }>;
  tokens: EnumDictionary<Net, Array<{ symbol: string; address: string }>>;

  addToken: (network: Net, address: string, token) => void;
  removeToken: (network: Net, address: string) => void;
}

export default function Balances(props: IBalancesProps) {
  const [tokenModal, handleModal] = useState({
    show: false,
    new: false
  });
  const [balance, updateBalance] = useState('');
  const [tokenContract, updateContract] = useState({
    address: '',
    error: ''
  });

  const [tokenBalances, updateTokenbalances] = useState([]);

  const [tokenData, updateTokenData] = useState({
    address: '',
    name: '',
    symbol: '',
    decimals: new BigNumber(0),
    extras: {}
  });

  const openTokenDialog = (newToken: boolean, address?: string) => {
    if (newToken) {
      handleModal({
        show: true,
        new: true
      });
    } else {
      if (!address) {
        return;
      }
      const tokenInfo = props.tokens[props.network][address];
      if (tokenInfo === undefined) {
        return;
      }
      updateTokenData({
        address: address,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        extras: tokenInfo.extras
      });
      handleModal({
        show: true,
        new: false
      });
    }
  };

  const closeTokenDialog = () => {
    handleModal({
      ...tokenModal,
      show: false
    });
    updateTokenData({
      address: '',
      name: '',
      symbol: '',
      decimals: new BigNumber(0),
      extras: {}
    });
    updateContract({
      address: '',
      error: ''
    });
  };

  const saveToken = () => {
    props.addToken(props.network, tokenContract.address, tokenData);
    closeTokenDialog();
  };

  const convertMap = (map: Map<string, string>): Object => {
    return [...map.entries()].reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  };
  const checkContractAddress = async (event) => {
    // get form value
    const formValue = event.currentTarget.value;

    if (formValue === '') {
      updateContract({
        address: '',
        error: ''
      });
      return;
    }
    if (!isContractAddress(formValue)) {
      updateContract({
        address: formValue,
        error: 'This is not a valid contract address'
      });
    } else {
      updateContract({
        address: formValue,
        error: ''
      });
      const fetchedTokenData = await getTokenData(props.net2client[props.network], formValue);
      updateTokenData({
        address: formValue,
        name: fetchedTokenData.name,
        symbol: fetchedTokenData.symbol,
        decimals: fetchedTokenData.decimals,
        extras: convertMap(fetchedTokenData.extras)
      });
    }
  };

  const getTokenBalance = async (contractAddress: string, holderAddress: string) => {
    // If contract address is not a valid contract, don't attempt to look up the balance
    if (!isContractAddress(contractAddress)) {
      return;
    }
    const client = props.net2client[props.network];
    const contract = await client.contract.at(contractAddress);
    const storage: any = await contract.storage();
    const token_metadata = await storage.token_metadata.get('0');
    const balance: BigNumber = (await storage.ledger.get(holderAddress)).balance;
    const adjustedBalance = balance.dividedBy(new BigNumber(10).pow(token_metadata.decimals));

    updateTokenbalances((oldArray) => [
      ...oldArray,
      { name: token_metadata.name, symbol: token_metadata.symbol, amount: adjustedBalance.toString() }
    ]);
  };

  useEffect(() => {
    checkContractAddress({
      currentTarget: {
        value: 'KT1JE97wUP7pmWRy7vKYHbuVoMnF9tcX4cY7'
      }
    });
    store.subscribe(async () => {
      const state = store.getState();
      console.log(state);
      const address = state.accounts[state.network].address;
      const client = state.net2client[state.network];
      if (address !== '') {
        updateBalance((await client.rpc.getBalance(address)).dividedBy(new BigNumber(10).pow(6)).toString());
        const tokenContracts = state.tokens[state.network];
        updateTokenbalances([]);
        for (const contractAddress in tokenContracts) {
          getTokenBalance(contractAddress, address);
        }
        // tokenContracts.forEach(async (tokenContract) => {
        //   console.log(tokenContract.address);
        //   getTokenBalance(tokenContract.address, address);
        // });
      } else {
        updateBalance('');
      }
    });
    return function cleanup() {};
  }, []);

  return (
    <div>
      <div>
        {props.accounts[props.network].address === '' ? (
          <div></div>
        ) : (
          <div>
            <br />
            <h3>Balances</h3>
            {balance !== '' ? (
              <div>
                <h5>
                  {balance} <b>ꜩ</b>
                </h5>
                {tokenBalances.length === 0 ? (
                  <div></div>
                ) : (
                  <Accordion defaultActiveKey="0" className="mt-3 w-25">
                    <Card>
                      <Accordion.Toggle as={Card.Header} eventKey="0" style={{ cursor: 'pointer' }}>
                        Your token balances
                      </Accordion.Toggle>
                      <Accordion.Collapse eventKey="0">
                        <Card.Body className="Balances-token">
                          {tokenBalances.map((item, i) => {
                            return (
                              <p key={i}>
                                {/* Capitalize first letter */}
                                <b>{item.name}: </b>
                                {item.amount} {item.symbol}
                              </p>
                            );
                          })}
                        </Card.Body>
                      </Accordion.Collapse>
                    </Card>
                  </Accordion>
                )}
              </div>
            ) : (
              <Loading center={false}>Loading balances...</Loading>
            )}
            {Object.keys(props.tokens[props.network]).length === 0 ? (
              <div></div>
            ) : (
              <div>
                <h4 className="mt-4">Your Tokens</h4>
                {Object.keys(props.tokens[props.network]).map((tokenAddress, i) => {
                  return (
                    <h4 key={i}>
                      <Badge
                        pill
                        variant="primary"
                        className="d-inline-flex justify-content-between align-items-center pointer"
                        onClick={() => openTokenDialog(false, tokenAddress)}
                      >
                        <span className="mr-1">{props.tokens[props.network][tokenAddress].symbol}</span>
                        <button className="icon-button" onClick={() => props.removeToken(props.network, tokenAddress)}>
                          <div>
                            <FaMinusCircle className="text-light" aria-label="delete" />
                          </div>
                        </button>
                      </Badge>
                    </h4>
                  );
                })}
              </div>
            )}
            <h4 className="mt-4">Add a custom Token</h4>
            <p>You can add a custom token implemented under the FA2 standard here.</p>
            <InputGroup>
              <FormControl
                placeholder="Token Contract Address"
                onChange={checkContractAddress}
                value={tokenContract.address}
              />
              <InputGroup.Append>
                <Button
                  variant="outline-primary"
                  onClick={() => openTokenDialog(true)}
                  disabled={tokenContract.error !== '' || tokenContract.address === ''}
                >
                  Add Token
                </Button>
              </InputGroup.Append>
            </InputGroup>
            <FormText className="text-danger">{tokenContract.error}</FormText>
          </div>
        )}
      </div>
      <Modal centered show={tokenModal.show} onHide={closeTokenDialog}>
        {tokenData.name === '' ? (
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
              <Modal.Title>{tokenData.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                <b>Address: </b> {tokenData.address}
              </p>
              <p>
                <b>Symbol: </b> {tokenData.symbol}
              </p>
              <p>
                <b>Decimals: </b> {tokenData.decimals.toString()}
              </p>
              {Object.keys(tokenData.extras).length !== 0 ? (
                <Accordion>
                  <Card>
                    <Accordion.Toggle as={Card.Header} eventKey="0" style={{ cursor: 'pointer' }}>
                      Show additional information
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                      <Card.Body>
                        {Object.keys(tokenData.extras).map((key, i) => {
                          return (
                            <p key={i}>
                              {/* Capitalize first letter */}
                              <b>{key.charAt(0).toUpperCase() + key.slice(1)}: </b>
                              {tokenData.extras[key]}
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
          <Button variant="secondary" onClick={closeTokenDialog}>
            Close
          </Button>
          {tokenModal.new && tokenData.name !== '' ? (
            <Button variant="primary" onClick={saveToken}>
              Add Token
            </Button>
          ) : (
            <div></div>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
