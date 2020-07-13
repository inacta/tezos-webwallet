import { ValidationResult, validateAddress } from '@taquito/utils';
import BigNumber from 'bignumber.js';
import { EnumDictionary } from './shared/AbstractTypes';
import { IInfoMessage } from './shared/OtherTypes';
import { Net } from './shared/TezosTypes';
import React from 'react';
import { TezosToolkit } from '@taquito/taquito';
import { conversionFactor } from './numbers';

interface IBalanceProps {
  net2Client: EnumDictionary<Net, TezosToolkit>;
}

interface IBalanceState {
  error: string | undefined;
  infoMessage: IInfoMessage | undefined;
  mainnetAddress: string;
  mainnetBalance: BigNumber | undefined;
  mainnetTokenAddress: string;
  mainnetTokenBalance: BigNumber | undefined;
  testnetAddress: string;
  testnetTokenAddress: string;
  testnetBalance: BigNumber | undefined;
  testnetTokenBalance: BigNumber | undefined;
}

export class Balance extends React.Component<IBalanceProps, IBalanceState> {
  public constructor(props: IBalanceProps) {
    super(props);
    this.state = {
      error: undefined,
      infoMessage: undefined,
      mainnetAddress: '',
      mainnetBalance: undefined,
      mainnetTokenAddress: '',
      mainnetTokenBalance: undefined,
      testnetAddress: '',
      testnetTokenAddress: '',
      testnetBalance: undefined,
      testnetTokenBalance: undefined
    };
  }

  public render() {
    const errorElem = this.state.error && (
      <div className="alert alert-danger" role="alert">
        {this.state.error}
      </div>
    );
    return (
      <div>
        <p>Check Tezi and token balances</p>
        {errorElem}
        <form>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="mainnet-address-input">Mainnet address</label>
                <div className="input-group mb-3" id="mainnet-address-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Mainnet address"
                    value={this.state.mainnetAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      this.setState({ mainnetAddress: e.target.value })
                    }
                    aria-label="Mainnet address"
                  />
                  <div className="input-group-append">
                    <button
                      className="btn btn-outline-primary"
                      disabled={validateAddress(this.state.mainnetAddress) !== ValidationResult.VALID}
                      onClick={() => this.setBalances(Net.Mainnet)}
                      type="button"
                    >
                      Show
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="mainnet-token-address-input">Token address</label>
                <div className="input-group mb-3" id="mainnet-token-address-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Token address"
                    value={this.state.mainnetTokenAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      this.setState({ mainnetTokenAddress: e.target.value })
                    }
                    aria-label="Mainnet token address"
                  />
                </div>
                <small className="form-text text-muted">Leave token address blank to only get Tezos balance</small>
              </div>
              <p>{this.state.mainnetBalance && `${this.state.mainnetBalance.toString()} ꜩ`}</p>
              <p>{this.state.mainnetTokenBalance && `${this.state.mainnetTokenBalance.toString()} tokens`}</p>
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="testnet-address-input">Testnet address</label>
                <div className="input-group mb-3" id="testnet-address-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Testnet address"
                    value={this.state.testnetAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      this.setState({ testnetAddress: e.target.value })
                    }
                    aria-label="Testnet address"
                  />
                  <div className="input-group-append">
                    <button
                      className="btn btn-outline-secondary"
                      disabled={validateAddress(this.state.testnetAddress) !== ValidationResult.VALID}
                      onClick={() => this.setBalances(Net.Testnet)}
                      type="button"
                    >
                      Show
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="testnet-token-address-input">Token address</label>
                <div className="input-group mb-3" id="testnet-token-address-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Token address"
                    value={this.state.testnetTokenAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      this.setState({ testnetTokenAddress: e.target.value })
                    }
                    aria-label="Testnet token address"
                  />
                </div>
                <small className="form-text text-muted">Leave token address blank to only get Tezos balance</small>
              </div>
              <p>{this.state.testnetBalance && `${this.state.testnetBalance.toString()} ꜩ`}</p>
              <p>{this.state.testnetTokenBalance && `${this.state.testnetTokenBalance.toString()} tokens`}</p>
            </div>
          </div>
        </form>
      </div>
    );
  }

  private setTokenBalance(net: Net): void {
    const contractAddress = net === Net.Mainnet ? this.state.mainnetTokenAddress : this.state.testnetTokenAddress;

    // If contract address is not a valid contract, don't attempt to look up the balance
    if (
      contractAddress === '' ||
      validateAddress(contractAddress) !== ValidationResult.VALID ||
      contractAddress.substring(0, 3) !== 'KT1'
    ) {
      return;
    }

    // Adapted from https://tezostaquito.io/docs/smartcontracts
    const targetAddress = net === Net.Mainnet ? this.state.mainnetAddress : this.state.testnetAddress;
    try {
      this.props.net2Client[net].contract.at(contractAddress).then((c) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        c.storage().then((s: any) =>
          s.ledger.get(targetAddress).then((d) => {
            // s will be undefined here iff address has not interacted with token (has never had a balance)
            if (net === Net.Mainnet) {
              this.setState({
                mainnetTokenBalance: d?.balance === undefined ? new BigNumber(0) : new BigNumber(d.balance)
              });
            } else {
              this.setState({
                testnetTokenBalance: d?.balance === undefined ? new BigNumber(0) : new BigNumber(d.balance)
              });
            }
          })
        );
      });
    } catch (error) {
      this.setState({
        infoMessage: {
          clearCallback: () => this.setState({ infoMessage: undefined }),
          message: `Failed to get token balance: ${error}`,
          class: 'alert-danger'
        }
      });
    }
  }

  private setBalances(net: Net): void {
    this.props.net2Client[net].rpc
      .getBalance(net === Net.Mainnet ? this.state.mainnetAddress : this.state.testnetAddress)
      .then((balance) => {
        if (net === Net.Mainnet) {
          this.setState({ mainnetBalance: balance.dividedBy(conversionFactor) });
        } else {
          this.setState({ testnetBalance: balance.dividedBy(conversionFactor) });
        }
      })
      .then(() => this.setTokenBalance(net))
      .catch((ex) => {
        this.setState({ error: `Failed to get ${net} balance. ` + ex?.messae ?? ex?.name });
      });
  }
}
