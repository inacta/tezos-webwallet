import { InMemorySigner, importKey } from '@taquito/signer';
import { ContractPublicationCard } from './ContractPublicationCard';
import { EnumDictionary } from './shared/AbstractTypes';
import { Net } from './shared/TezosTypes';
import React from 'react';
import { TezosToolkit } from '@taquito/taquito';

export interface IContractPublicationProps {
  net2Client: EnumDictionary<Net, TezosToolkit>;
}

interface IContractPublicationState {
  mainnetPrivateKey: string;
  mainnetAddress: string;
  testnetAddress: string;
  testnetPrivateKey: string;
}

export class ContractPublication extends React.Component<IContractPublicationProps, IContractPublicationState> {
  public constructor(props: IContractPublicationProps) {
    super(props);
    this.state = {
      mainnetAddress: '',
      mainnetPrivateKey: '',
      testnetAddress: '',
      testnetPrivateKey: ''
    };
  }

  public componentDidUpdate(_prevProps, prevState: IContractPublicationState) {
    // Clear address if private key is changed to prevent money from being sent
    // to an address that the user does not have access to
    if (prevState.mainnetPrivateKey !== this.state.mainnetPrivateKey) {
      this.setState({ mainnetAddress: '' });
    }
    if (prevState.testnetPrivateKey !== this.state.testnetPrivateKey) {
      this.setState({ testnetAddress: '' });
    }
  }

  public render() {
    const validMainnetSk = this.isValidSecretKey(Net.Mainnet);
    const validTestnetSk = this.isValidSecretKey(Net.Testnet);
    return (
      <div>
        <form>
          <div className="row">
            <div className="col-10">
              <div className="form-group">
                <label htmlFor="mainnet-sk-input">Secret key for mainnet</label>
                <div className="input-group mb-3" id="mainnet-sk-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Secret key"
                    value={this.state.mainnetPrivateKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      this.changePrivateKey(e.target.value, Net.Mainnet)
                    }
                    aria-label="Secret key for mainnet"
                  />
                  <div className="input-group-append">
                    <button
                      className={`btn btn-primary ${validMainnetSk} ? '' : 'btn-disabled'`}
                      onClick={() => this.pickPrivateKey(Net.Mainnet)}
                      type="button"
                      disabled={!validMainnetSk}
                    >
                      Use key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        {this.state.mainnetAddress && (
          <ContractPublicationCard client={this.props.net2Client[Net.Mainnet]} net={Net.Mainnet} />
        )}
        <br />
        <form>
          <div className="row">
            <div className="col-10">
              <div className="form-group">
                <label htmlFor="mainnet-sk-input">Secret key for testnet</label>
                <div className="input-group mb-3" id="testnet-sk-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Secret key"
                    value={this.state.testnetPrivateKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      this.setState({ testnetPrivateKey: e.target.value })
                    }
                    aria-label="Secret key for testnet"
                  />
                  <div className="input-group-append">
                    <button
                      className={'btn btn-secondary add-outline ' + (validTestnetSk ? '' : 'btn-disabled')}
                      disabled={!validTestnetSk}
                      onClick={() => this.pickPrivateKey(Net.Testnet)}
                      type="button"
                    >
                      Use key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        {this.state.testnetAddress && (
          <ContractPublicationCard client={this.props.net2Client[Net.Testnet]} net={Net.Testnet} />
        )}
      </div>
    );
  }

  private changePrivateKey(value: string, net: Net): void {
    if (Net.Mainnet === net) {
      this.setState({ mainnetPrivateKey: value });
      this.setState({ mainnetAddress: '' });
    } else {
      this.setState({ testnetPrivateKey: value });
      this.setState({ testnetAddress: '' });
    }
  }

  private isValidSecretKey(net: Net): boolean {
    try {
      new InMemorySigner(net === Net.Mainnet ? this.state.mainnetPrivateKey : this.state.testnetPrivateKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async pickPrivateKey(net: Net) {
    await importKey(
      this.props.net2Client[net],
      net === Net.Mainnet ? this.state.mainnetPrivateKey : this.state.testnetPrivateKey
    );
    if (net === Net.Mainnet) {
      await this.props.net2Client[net].signer
        .publicKeyHash()
        .then((address) => this.setState({ mainnetAddress: address }));
    } else if (net === Net.Testnet) {
      await this.props.net2Client[net].signer
        .publicKeyHash()
        .then((address) => this.setState({ testnetAddress: address }));
    } else {
      throw Error(`Unknown net: ${net}`);
    }
  }
}
