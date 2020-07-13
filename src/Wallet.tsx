import { InMemorySigner, importKey } from '@taquito/signer';
import { Prefix, b58cencode, prefix } from '@taquito/utils';
import { AccountCard } from './AccountCard';
import { EnumDictionary } from './shared/AbstractTypes';
import { Net } from './shared/TezosTypes';
import React from 'react';
import { TezosToolkit } from '@taquito/taquito';

export interface IWalletProps {
  net2Client: EnumDictionary<Net, TezosToolkit>;
}

interface IWalletState {
  mainnetPrivateKey: string;
  mainnetAddress: string;
  testnetAddress: string;
  testnetPrivateKey: string;
}

export class Wallet extends React.Component<IWalletProps, IWalletState> {
  public constructor(props: IWalletProps) {
    super(props);
    this.state = {
      mainnetAddress: '',
      mainnetPrivateKey: '',
      testnetAddress: '',
      testnetPrivateKey: ''
    };
  }

  public componentDidUpdate(_prevProps, prevState: IWalletState) {
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
                    className="btn btn-outline-primary"
                    onClick={() => this.getRandomSecretKey(Net.Mainnet)}
                    type="button"
                  >
                    Generate key
                  </button>
                </div>
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
            {this.state.mainnetAddress && <AccountCard client={this.props.net2Client[Net.Mainnet]} net={Net.Mainnet} />}
          </div>
        </div>
        <br />
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
                    className="btn btn-outline-secondary"
                    onClick={() => this.getRandomSecretKey(Net.Testnet)}
                    type="button"
                  >
                    Generate key
                  </button>
                </div>
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
            {this.state.testnetAddress && <AccountCard client={this.props.net2Client[Net.Testnet]} net={Net.Testnet} />}
          </div>
        </div>
      </form>
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

  private getRandomSecretKey(net: Net) {
    // Declare and populate an array `rand` with cryptographically secure random numbers
    // This should be cryptographically secure. Math.random() is not.
    // xor'ing bad randomsness with good randomness yields good randomness
    const initRands0 = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
    const randBad0 = Uint8Array.from(initRands0);
    const initRands1 = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
    const randBad1 = Uint8Array.from(initRands1);

    // Cryptographically secure PRNG
    let randGood = Uint8Array.from(initRands1);
    window.crypto.getRandomValues(randGood);
    randGood = randGood.map((e, i) => e ^ randBad0[i] ^ randBad1[i]);

    // Sanity check to ensure we are not using an unitialized random key
    // and that we are not using something directly from Math.random
    // since that RNG is not cryptographically secure
    const randBad2 = randBad0.map((e, i) => e ^ randBad1[i]);
    if (
      randGood.reduce((acc, x) => acc + x) === 0 ||
      randGood.every((e, i) => e === randBad0[i]) ||
      randGood.every((e, i) => e === randBad1[i]) ||
      randGood.every((e, i) => e === randBad2[i]) ||
      randBad2.every((e) => e === 0)
    ) {
      throw Error('Invalid secret key used');
    }

    const key = b58cencode(randGood, prefix[Prefix.SPSK]);

    // Use this value to set the secret key
    if (net === Net.Testnet) {
      this.setState({ testnetPrivateKey: key });
      this.setState({ testnetAddress: '' });
    } else {
      this.setState({ mainnetPrivateKey: key });
      this.setState({ mainnetAddress: '' });
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

    this.storeAddressPrivateKeyPair(net);
  }

  private storeAddressPrivateKeyPair(net: Net) {
    // TODO: Change this to store only one value in localstorage
    // as the key must not be an address as we cannot ask for all
    // key/value pairs in localStorage.
    localStorage.setItem(
      `tezos-sk-${net.toString()}:${net === Net.Mainnet ? this.state.mainnetAddress : this.state.testnetAddress}`,
      net === Net.Mainnet ? this.state.mainnetPrivateKey : this.state.testnetPrivateKey
    );
  }

  // TODO: Shouldn't we save all private keys in localStorage?
}
