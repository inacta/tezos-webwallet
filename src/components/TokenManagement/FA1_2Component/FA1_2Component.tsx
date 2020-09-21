import React, { useCallback, useEffect, useState } from 'react';
import Loading from '../../shared/Loading/Loading';
import FA1_2TransferModal from './FA1_2TransferModal/FA1_2TransferModal';
import {
  getContract,
  getTokenData,
  checkAddress,
  modifyWhitelist,
  modifyWhitelistAdmin
} from '../../../shared/TezosService';
import { TokenStandard, WhitelistVersion } from '../../../shared/TezosTypes';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FaCheckCircle, FaMinusCircle, FaTimesCircle } from 'react-icons/fa';
import MaterialTable from 'material-table';
import { addNotification } from '../../../shared/NotificationService';

interface IFA1_2Component {
  address: string;
  contractAddress: string;
  token: { symbol: string; whitelistVersion?: WhitelistVersion };
  showTransfer: boolean;
}

export default function FA1_2Component(props: IFA1_2Component) {
  const materialTableRef = React.createRef() as any;
  const [balance, updateBalance] = useState('');
  const [totalSupply, updateTotalSupply] = useState('');
  const [whitelistVersion, updateWhitelistVersion] = useState(WhitelistVersion.NO_WHITELIST);
  const [showModal, updateModal] = useState(false);
  const [whitelistAdmin, updateWhitelistAdmin] = useState(false);
  const [NRWwhitelistAdmin, updateNRWWhitelistAdmin] = useState(false);
  const [whitelisterList, updateWhitelisterList] = useState([]);
  const [whitelistedList, updateWhitelistedList] = useState([]);
  const [disabled, updateDisabled] = useState(false);

  const getTokenInfo = useCallback(async () => {
    const contract = await getContract(props.contractAddress);
    const data = await getTokenData(contract, TokenStandard.FA1_2);
    updateTotalSupply(data.total_supply.toFixed());
    const ledgerEntry = await data.ledger.get(props.address);
    if (props.token.whitelistVersion === WhitelistVersion.V0) {
      // if token has whitelisting capabilities, check if user is whitelisted, whitelister or whitelist admin
      updateWhitelistedList(data.whitelisteds);
      updateWhitelisterList(data.whitelisters);
      updateWhitelistAdmin(data.whitelist_admins.includes(props.address));
      updateNRWWhitelistAdmin(data.non_revocable_whitelist_admin === props.address);
      updateWhitelistVersion(WhitelistVersion.V0);
    }
    updateBalance(ledgerEntry ? ledgerEntry.balance.toFixed() : '0');
  }, [props]);

  useEffect(() => {
    getTokenInfo();
    return () => {};
  }, [getTokenInfo]);

  const transformArray = (list: string[]): { address: string }[] => {
    return list.map((obj: string) => {
      return {
        address: obj
      };
    });
  };

  return (
    <div>
      {balance !== '' ? (
        <div>
          <Row>
            <Col>
              <div className="d-flex justify-content-between">
                <div>
                  <h4>Balance</h4>
                  <h5>
                    {balance} <b>{props.token.symbol}</b>
                  </h5>
                  {props.showTransfer &&
                  (whitelistVersion === WhitelistVersion.NO_WHITELIST || whitelistedList.includes(props.address)) ? (
                    <>
                      <Button onClick={() => updateModal(true)}>Transfer</Button>
                      <FA1_2TransferModal
                        show={showModal}
                        hideModal={() => updateModal(false)}
                        symbol={props.token.symbol}
                        balance={balance}
                        balanceCallback={getTokenInfo}
                        contractAddress={props.contractAddress}
                      ></FA1_2TransferModal>
                    </>
                  ) : (
                    <></>
                  )}
                </div>
                {whitelistVersion !== WhitelistVersion.NO_WHITELIST ? (
                  <div className="d-flex align-items-center">
                    <h5>
                      <span className="mr-2">Whitelist status</span>
                      {whitelistedList.includes(props.address) ? (
                        <FaCheckCircle className="text-success" />
                      ) : (
                        <FaTimesCircle className="text-danger" />
                      )}
                    </h5>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </Col>
          </Row>
          <hr />
          <Row>
            <Col>
              <h4>Details</h4>
            </Col>
          </Row>
          <Row>
            <Col>
              <b>Total supply:</b> {totalSupply} {props.token.symbol}
            </Col>
            <Col>
              <b>Decimals: </b> 0
            </Col>
          </Row>
          {whitelistVersion === WhitelistVersion.V0 ? (
            <>
              <hr />
              <Row>
                <Col>
                  <h4>Whitelist</h4>
                </Col>
              </Row>
              <Row>
                <Col>
                  <MaterialTable
                    title="Whitelisted addresses"
                    columns={[{ title: 'Address', field: 'address', width: 'auto' }]}
                    actions={
                      props.showTransfer && whitelisterList.includes(props.address)
                        ? [
                            {
                              icon: () => <FaMinusCircle className={disabled ? 'text-muted' : 'text-primary'} />,
                              disabled: disabled,
                              tooltip: 'Remove from whitelist',
                              onClick: async (event, rowData: { address: string }) => {
                                updateDisabled(true);
                                try {
                                  await modifyWhitelist(
                                    whitelistVersion,
                                    props.contractAddress,
                                    rowData.address,
                                    false,
                                    null,
                                    getTokenInfo
                                  );
                                } catch (e) {
                                  if (e.message === 'rejected') {
                                    addNotification('danger', 'The user rejected the transaction');
                                  } else {
                                    console.error(e);
                                    addNotification('danger', 'An error occurred');
                                  }
                                }
                                updateDisabled(false);
                              }
                            }
                          ]
                        : []
                    }
                    data={transformArray(whitelistedList)}
                    editable={
                      props.showTransfer && whitelisterList.includes(props.address)
                        ? {
                            onRowAdd: async (newData) => {
                              const valid = checkAddress(newData.address);
                              if (valid !== '') {
                                addNotification('danger', valid);
                                throw new Error('Invalid address');
                              }
                              if (whitelistedList.includes(newData.address)) {
                                addNotification('danger', 'Address is already whitelisted');
                                throw new Error('Address is already whitelisted');
                              }
                              try {
                                await modifyWhitelist(
                                  whitelistVersion,
                                  props.contractAddress,
                                  newData.address,
                                  true,
                                  null,
                                  getTokenInfo
                                );
                              } catch (e) {
                                if (e.message === 'rejected') {
                                  addNotification('danger', 'The user rejected the transaction');
                                } else {
                                  console.error(e);
                                  addNotification('danger', 'An error occurred');
                                }
                                // keep address input active by throwing an errors
                                throw new Error();
                              }
                            }
                          }
                        : {}
                    }
                    tableRef={materialTableRef}
                  ></MaterialTable>
                </Col>
              </Row>

              <hr />
              <Row>
                <Col>
                  <h4>
                    Whitelist administration
                    {NRWwhitelistAdmin ? <small className="ml-2 text-muted">non revokable admin</small> : <></>}
                  </h4>
                </Col>
              </Row>
              <Row>
                <Col>
                  <MaterialTable
                    title="Whitelist admins"
                    columns={[{ title: 'Address', field: 'address', width: 'auto' }]}
                    actions={
                      props.showTransfer && (whitelistAdmin || NRWwhitelistAdmin)
                        ? [
                            {
                              icon: () => <FaMinusCircle className={disabled ? 'text-muted' : 'text-primary'} />,
                              disabled: disabled,
                              tooltip: 'Remove admin',
                              onClick: async (event, rowData: { address: string }) => {
                                updateDisabled(true);
                                try {
                                  await modifyWhitelistAdmin(
                                    whitelistVersion,
                                    props.contractAddress,
                                    rowData.address,
                                    false,
                                    null,
                                    getTokenInfo
                                  );
                                } catch (e) {
                                  if (e.message === 'rejected') {
                                    addNotification('danger', 'The user rejected the transaction');
                                  } else {
                                    console.error(e);
                                    addNotification('danger', 'An error occurred');
                                  }
                                }
                                updateDisabled(false);
                              }
                            }
                          ]
                        : []
                    }
                    data={transformArray(whitelisterList)}
                    editable={
                      props.showTransfer && (whitelistAdmin || NRWwhitelistAdmin)
                        ? {
                            onRowAdd: async (newData) => {
                              const valid = checkAddress(newData.address);
                              if (valid !== '') {
                                addNotification('danger', valid);
                                throw new Error('Invalid address');
                              }
                              if (whitelisterList.includes(newData.address)) {
                                addNotification('danger', 'Address is already administrator');
                                throw new Error('Address is already administrator');
                              }
                              try {
                                await modifyWhitelistAdmin(
                                  whitelistVersion,
                                  props.contractAddress,
                                  newData.address,
                                  true,
                                  null,
                                  getTokenInfo
                                );
                              } catch (e) {
                                if (e.message === 'rejected') {
                                  addNotification('danger', 'The user rejected the transaction');
                                } else {
                                  console.error(e);
                                  addNotification('danger', 'An error occurred');
                                }
                                // keep address input active by throwing an error
                                throw new Error();
                              }
                            }
                          }
                        : {}
                    }
                    tableRef={materialTableRef}
                  ></MaterialTable>
                </Col>
              </Row>
            </>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <Loading center={false}>Loading balance...</Loading>
      )}
    </div>
  );
}
