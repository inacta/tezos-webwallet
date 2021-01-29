/* eslint-disable @typescript-eslint/no-unused-vars */
import { ContractAbstraction, ContractProvider } from '@taquito/taquito';
import { TokenStandard, WhitelistVersion } from '../../../shared/TezosTypes';
import { getContract, getTokenBalance } from '../../../shared/TezosService';
import BigNumber from 'bignumber.js';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import FA2TransferModal from './FA2_TransferModal/FA2_TransferModal';
import { IKissDetails } from '../../../shared/KissTypes';
import { KissModalAdmin } from '../KissModalAdmin';
import { KissModalUser } from '../KissModalUser';
import React from 'react';
import Row from 'react-bootstrap/Row';
import { isWallet } from '../../../shared/TezosUtil';

interface IFA2_ComponentProps {
  address: string;
  contractAddress: string;
  token: { kissDetails?: IKissDetails; symbol: string; whitelistVersion?: WhitelistVersion };
  showTransfer: boolean;
}

interface IFA2_ComponentState {
  kissTokenBalance: BigNumber;
  NRWwhitelistAdmin: boolean;
  showTandemAdminModal: boolean;
  showTandemUserModal: boolean;
  showTransferModal: boolean;
  whitelistAdmin: boolean;
  whitelistedList: string[];
  whitelisterList: string[];
  whitelistVersion: WhitelistVersion;
}

export default class FA2Component extends React.Component<IFA2_ComponentProps, IFA2_ComponentState> {
  private constructor(props: IFA2_ComponentProps) {
    super(props);
    this.state = {
      kissTokenBalance: new BigNumber(0),
      NRWwhitelistAdmin: false,
      showTandemAdminModal: false,
      showTandemUserModal: false,
      showTransferModal: false,
      whitelistAdmin: false,
      whitelistedList: [] as string[],
      whitelisterList: [] as string[],
      whitelistVersion: WhitelistVersion.NO_WHITELIST
    };
  }

  private async updateKissTokenBalance() {
    getTokenBalance(TokenStandard.FA2, this.props.contractAddress, this.props.address, '0').then((balance) =>
      this.setState({ kissTokenBalance: balance })
    );
  }

  private async getTokenInfo() {
    const contract = (await getContract(this.props.contractAddress)) as ContractAbstraction<ContractProvider>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storage: any = await contract.storage();
    if (this.props.token.whitelistVersion === WhitelistVersion.V0) {
      // if token has whitelisting capabilities, check if user is whitelisted, whitelister or whitelist admin
      this.setState({
        whitelistedList: storage.whitelisteds,
        whitelisterList: storage.whitelisters,
        whitelistAdmin: storage.whitelist_admins.includes(this.props.address),
        NRWwhitelistAdmin: storage.non_revocable_whitelist_admin === this.props.address,
        whitelistVersion: WhitelistVersion.V0
      });
    }

    // If token is of KISS type and address is known, load KISS balance
    if (this.props.token.kissDetails && this.props.address) {
      storage.ledger
        .get(this.props.address)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((entry: any) => entry.balances.get('0'))
        .then((kissTokenBalance: BigNumber) => this.setState({ kissTokenBalance }))
        .catch(() => this.setState({ kissTokenBalance: new BigNumber(0) }));
    }
  }

  public componentDidMount() {
    if (this.props.token.kissDetails) {
      this.updateKissTokenBalance();
      this.getTokenInfo();
    }
  }

  public render() {
    // Only show tandem registration button if this token supports tandems (it is a KISS token)
    // *and* iff the secret key solution (Ledger, in-memory etc.) supports this functionality.
    let tandemButtonUser: JSX.Element | undefined = undefined;
    if (this.props.token.kissDetails && !isWallet()) {
      tandemButtonUser = (
        <>
          <br />
          <Button onClick={() => this.setState({ showTandemUserModal: true })}>Register tandem</Button>
          <br />
          <br />
        </>
      );
    }

    // Show the button to register tandems as an admin if user is administrator of KISS contract
    // No signatures are needed for this function call into the smart contract, so it can be done
    // with any secret key/wallet solution.'
    let tandemButtonAdmin: JSX.Element | undefined = undefined;
    if (this.props.token.kissDetails && this.props.token.kissDetails.admin === this.props.address) {
      tandemButtonAdmin = (
        <>
          <Button onClick={() => this.setState({ showTandemAdminModal: true })}>Register tandem as admin</Button>
          <br />
          <br />
        </>
      );
    }

    return (
      <div>
        <div>
          <h3>FA2 contract {this.props.contractAddress}</h3>
        </div>
        <div>
          <Row>
            <Col>
              <Button onClick={() => this.setState({ showTransferModal: true })}>Transfer</Button>
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
              {tandemButtonUser}
              {tandemButtonAdmin}
              <KissModalUser
                balance={this.state.kissTokenBalance.toNumber()}
                tokenBalanceCallback={() => this.getTokenInfo()}
                contractAddress={this.props.contractAddress}
                hideModal={() => this.setState({ showTandemUserModal: false })}
                show={this.state.showTandemUserModal}
                symbol={this.props.token.symbol}
              ></KissModalUser>

              <KissModalAdmin
                balance={this.state.kissTokenBalance.toNumber()}
                tokenBalanceCallback={() => this.getTokenInfo()}
                contractAddress={this.props.contractAddress}
                hideModal={() => this.setState({ showTandemAdminModal: false })}
                show={this.state.showTandemAdminModal}
                symbol={this.props.token.symbol}
              ></KissModalAdmin>
            </Col>
          </Row>
          <FA2TransferModal
            ownAddress={this.props.address}
            show={this.state.showTransferModal}
            hideModal={() => this.setState({ showTransferModal: false })}
            symbol={this.props.token.symbol}
            contractAddress={this.props.contractAddress}
            tokenInfoCallback={() => this.getTokenInfo()}
          ></FA2TransferModal>
        </div>
      </div>
    );
  }
}
