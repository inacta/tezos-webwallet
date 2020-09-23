import React, { Component } from 'react';
import './Main.scss';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Switch from 'react-switch';
import { setNetwork, changeAddress, addSigner, setRPCProvider, addToken, removeToken } from '../../redux/actions';
import { connect } from 'react-redux';
import { Net, WalletTypes } from '../../shared/TezosTypes';
import { EnumDictionary } from '../../shared/AbstractTypes';
import { TezosToolkit } from '@taquito/taquito';
import WalletManagement from './WalletManagement/WalletManagement';
import Balances from './Balances/Balances';
import Deployment from './Deployment/Deployment';
import { isValidAddress } from '../../shared/TezosUtil';
const qs = require('qs');

interface IMainProps {
  network: Net;
  accounts: EnumDictionary<Net, { address: string; signer?: WalletTypes }>;
  net2client: EnumDictionary<Net, TezosToolkit>;
  tokens: EnumDictionary<Net, Array<{ symbol: string; address: string }>>;
  location: {
    search: string;
  };

  setNetwork: (network: Net) => void;
  changeAddress: (address: string, network: Net) => void;
  addSigner: (address: string, network: Net, signer?: WalletTypes, wallet?: boolean) => void;
  setRPCProvider: (network: Net, rpc: string) => void;
  addToken: (network: Net, address: string, token) => void;
  removeToken: (network: Net, address: string) => void;
}

class Main extends Component<IMainProps, {}> {
  constructor(props: IMainProps) {
    super(props);
    const queryParams = qs.parse(this.props.location.search, { ignoreQueryPrefix: true });

    let network = this.props.network;

    if (queryParams.network === 'mainnet') {
      network = Net.Mainnet;
      this.props.setNetwork(Net.Mainnet);
    } else if (queryParams.network === 'carthage') {
      network = Net.Carthage;
      this.props.setNetwork(Net.Carthage);
    }

    if (isValidAddress(queryParams.address)) {
      this.props.addSigner(queryParams.address, network);
    }
  }

  switchNetwork = () => {
    if (this.props.network === Net.Mainnet) {
      this.props.setNetwork(Net.Carthage);
    } else {
      this.props.setNetwork(Net.Mainnet);
    }
  };

  getNetworkName = (network: Net) => {
    switch (network) {
      case Net.Mainnet:
        return 'Tezos Mainnet';
      case Net.Carthage:
        return 'Carthage Testnet';
    }
  };

  render() {
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
        <WalletManagement
          changeAddress={this.props.changeAddress}
          addSigner={this.props.addSigner}
          net2client={this.props.net2client}
          network={this.props.network}
          accounts={this.props.accounts}
        />
        <Balances
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
          <Deployment
            network={this.props.network}
            net2client={this.props.net2client}
            accounts={this.props.accounts}
            addToken={this.props.addToken}
          />
        )}
      </div>
    );
  }
}

let mapStateToProps = function(state) {
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
  removeToken: removeToken
};

let MainContainer = connect(mapStateToProps, mapDispatchToProps)(Main);

export default MainContainer;
