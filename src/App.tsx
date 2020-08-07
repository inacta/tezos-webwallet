import './App.scss';
import { Route } from 'react-router-dom';
import { Balance } from './Balance';
import { ContractPublication } from './ContractPublication';
import { EnumDictionary } from './shared/AbstractTypes';
import { Header } from './components/Header/Header';
import { Net } from './shared/TezosTypes';
import React from 'react';
import { SecretKeyConversion } from './SecretKeyConversion';
import { TezosToolkit } from '@taquito/taquito';
import { Wallet } from './Wallet';

import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Main from './components/Main/Main';

// Allow empty interface since I don't know how else to avoid warnings
// in the constructor.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IAppProps {}

interface IAppState {
  net2Client: EnumDictionary<Net, TezosToolkit>;
}

export class App extends React.Component<{}, IAppState> {
  private net2Client: EnumDictionary<Net, TezosToolkit> = {
    [Net.Mainnet]: new TezosToolkit(),
    [Net.Testnet]: new TezosToolkit()
  };

  public constructor(obj: IAppProps) {
    super(obj);
    this.net2Client[Net.Mainnet].setProvider({
      rpc: 'https://mainnet-tezos.giganode.io'
    });
    this.net2Client[Net.Testnet].setProvider({
      rpc: 'https://api.tez.ie/rpc/carthagenet/'
    });
    this.state = {
      net2Client: this.net2Client
    };
  }

  public render() {
    return (
      <div>
        <Header />
        <Container className="container pt-5">
          <Route path="/" component={Main}></Route>
          <Route path="/balance" exact={true} render={() => <Balance net2Client={this.state.net2Client} />} />
          <Route path="/wallet" exact={true} render={() => <Wallet net2Client={this.state.net2Client} />} />
          <Route
            path="/contract-deployment"
            exact={true}
            render={() => <ContractPublication net2Client={this.state.net2Client} />}
          />
          <Route path="/secret-key-conversion" exact={true} render={() => <SecretKeyConversion />} />
        </Container>
        {/* Footer */}
        <Navbar bg="light" fixed="bottom">
          &copy; {new Date().getFullYear()} inacta AG
        </Navbar>
      </div>
    );
  }
}

export default App;
