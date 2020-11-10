import './Main.scss';
import { ITokenDetails, Net, WalletTypes } from '../../shared/TezosTypes';
import React, { Component } from 'react';
import {
  addSigner,
  addToken,
  changeAddress,
  removeToken,
  resetSigner,
  setNetwork,
  setRPCProvider
} from '../../redux/actions';
import AddressComponent from './Balances/AddressComponent/AddressComponent';
import Balances from './Balances/Balances';
import Col from 'react-bootstrap/Col';
import { EnumDictionary } from '../../shared/AbstractTypes';
import { IAccountState } from '../../redux/reducers/accounts';
import { IReduxState } from '../../redux/reducers/index';
import { ITokenState } from '../../redux/reducers/tokens';
import OtherActions from './OtherActions';
import Row from 'react-bootstrap/Row';
import Switch from 'react-switch';
import { TezosToolkit } from '@taquito/taquito';
import WalletManagement from './WalletManagement/WalletManagement';
import { connect } from 'react-redux';

interface IMainProps {
  network: Net;
  accounts: IAccountState;
  net2client: EnumDictionary<Net, TezosToolkit>;
  tokens: ITokenState;
  location: {
    search: string;
  };

  setNetwork: (network: Net) => void;
  changeAddress: (address: string, network: Net) => void;
  addSigner: (address: string, network: Net, signer: WalletTypes, wallet: boolean) => void;
  setRPCProvider: (network: Net, rpc: string) => void;
  addToken: (network: Net, address: string, token: ITokenDetails) => void;
  removeToken: (network: Net, address: string) => void;
  resetSigner: (network: Net) => void;
}

class Main extends Component<IMainProps, {}> {
  private switchNetwork = () => {
    if (this.props.network === Net.Mainnet) {
      this.props.setNetwork(Net.Carthage);
    } else {
      this.props.setNetwork(Net.Mainnet);
    }
  };

  private getNetworkName = (network: Net) => {
    switch (network) {
      case Net.Mainnet:
        return 'Tezos Mainnet';
      case Net.Carthage:
        return 'Carthage Testnet';
    }
  };

  private resetSigner = () => {
    this.props.resetSigner(this.props.network);
  };

  public render() {
    // We have to declare address for TypeScript to understand that we have
    // made the appropriate null / undefined check. Cf.
    // https://stackoverflow.com/questions/64755402/why-cant-typescript-see-that-a-nested-value-cannot-be-undefined
    const ownAaddress = this.props.accounts[this.props.network]?.address;
    return (
      <div>
        {/* TITLE + TOGGLE */}
        <Row>
          <Col className="mb-3">
            <div className="float-right">
              <div className="Main-buttongroup d-flex mt-3 justify-content-end align-items-center">
                <span className="mr-1">{this.getNetworkName(Net.Carthage)}</span>
                <Switch
                  className="mr-1"
                  onChange={this.switchNetwork}
                  checked={this.props.network === Net.Mainnet}
                  checkedIcon={false}
                  uncheckedIcon={false}
                  offColor="#999999"
                  onColor="#9bbf73"
                  height={20}
                  width={40}
                  handleDiameter={14}
                />
                <span>{this.getNetworkName(Net.Mainnet)}</span>
              </div>
            </div>
          </Col>
        </Row>
        {ownAaddress === undefined ? (
          <WalletManagement
            changeAddress={this.props.changeAddress}
            addSigner={this.props.addSigner}
            net2client={this.props.net2client}
            network={this.props.network}
            accounts={this.props.accounts}
          />
        ) : (
          <>
            <AddressComponent address={ownAaddress} resetSigner={this.resetSigner} />
            <Balances
              address={ownAaddress}
              network={this.props.network}
              net2client={this.props.net2client}
              accounts={this.props.accounts}
              tokens={this.props.tokens}
              addToken={this.props.addToken}
              removeToken={this.props.removeToken}
            />
            {this.props.accounts[this.props.network].signer === undefined ? (
              <></>
            ) : (
              <OtherActions
                network={this.props.network}
                net2client={this.props.net2client}
                accounts={this.props.accounts}
                addToken={this.props.addToken}
              />
            )}
          </>
        )}
      </div>
    );
  }
}

let mapStateToProps = function(state: IReduxState) {
  return {
    network: state.network,
    accounts: state.accounts,
    net2client: state.net2client,
    tokens: state.tokens
  };
};

let mapDispatchToProps = {
  setNetwork: setNetwork,
  changeAddress: changeAddress,
  addSigner: addSigner,
  setRPCProvider: setRPCProvider,
  addToken: addToken,
  removeToken: removeToken,
  resetSigner: resetSigner
};

let MainContainer = connect(mapStateToProps, mapDispatchToProps)(Main);

export default MainContainer;
