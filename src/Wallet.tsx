import { InMemorySigner, importKey } from '@taquito/signer';
import { Prefix, b58cencode, prefix } from '@taquito/utils';
import { AccountCard } from './AccountCard';
import { EnumDictionary } from './shared/AbstractTypes';
import { Net } from './shared/TezosTypes';
import React from 'react';
import { TezosToolkit } from '@taquito/taquito';
import { printPdf } from './helpers/walletPdf';
import { sha256 } from 'crypto-hash';

export interface IWalletProps {
  net2Client: EnumDictionary<Net, TezosToolkit>;
}

interface IWalletState {
  mainnetSecretKey: string;
  mainnetAddress: string;
  testnetAddress: string;
  testnetSecretKey: string;
}

export class Wallet extends React.Component<IWalletProps, IWalletState> {
  public constructor(props: IWalletProps) {
    super(props);
    this.state = {
      mainnetAddress: '',
      mainnetSecretKey: '',
      testnetAddress: '',
      testnetSecretKey: ''
    };
  }

  public componentDidUpdate(_prevProps, prevState: IWalletState) {
    // Clear address if private key is changed to prevent money from being sent
    // to an address that the user does not have access to
    if (prevState.mainnetSecretKey !== this.state.mainnetSecretKey) {
      this.setState({ mainnetAddress: '' });
    }
    if (prevState.testnetSecretKey !== this.state.testnetSecretKey) {
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
                  value={this.state.mainnetSecretKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    this.changeSecretKey(e.target.value, Net.Mainnet)
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
                    onClick={() => this.pickSecretKey(Net.Mainnet)}
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
                  value={this.state.testnetSecretKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    this.setState({ testnetSecretKey: e.target.value })
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
                    onClick={() => this.pickSecretKey(Net.Testnet)}
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

  private changeSecretKey(value: string, net: Net): void {
    if (Net.Mainnet === net) {
      this.setState({ mainnetSecretKey: value });
      this.setState({ mainnetAddress: '' });
    } else {
      this.setState({ testnetSecretKey: value });
      this.setState({ testnetAddress: '' });
    }
  }

  private isValidSecretKey(net: Net): boolean {
    try {
      new InMemorySigner(net === Net.Mainnet ? this.state.mainnetSecretKey : this.state.testnetSecretKey);
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
      this.setState({ testnetSecretKey: key });
      this.setState({ testnetAddress: '' });
    } else {
      this.setState({ mainnetSecretKey: key });
      this.setState({ mainnetAddress: '' });
    }
  }

  private async pickSecretKey(net: Net) {
    const secretKey: string = net === Net.Mainnet ? this.state.mainnetSecretKey : this.state.testnetSecretKey;
    const confirmationToken: string = (await sha256(secretKey)).substr(0, 8);

    // Derive the address without setting the secret key on the Tezos object in state.
    // This is done to ensure that this secret key is not used before the user has
    // confirmed that they downloaded/printed the PDF with the secret key
    const localTezosToolkit = new TezosToolkit();
    await importKey(localTezosToolkit, secretKey);
    const derivedAddress: string = await localTezosToolkit.signer.publicKeyHash();

    // Open PDF and encourage user to download and print the generated PDF
    printPdf(derivedAddress, confirmationToken, net, secretKey);

    // Ensure that browser shows print/popup before prompt
    await this.sleep(4000);

    // Verify that the user has seen the PDF (and encourage them to download it)
    const response: string = window.prompt(
      'I have downloaded and printed the generated PDF. Confirmation key from document:'
    );

    // If the response was empty, stop execution here
    if (!response) {
      return;
    }

    // If the response does not match the one from the PDF, we never show the address,\
    // thus ensuring that the customer does not send assets to this account
    if (response !== confirmationToken) {
      window.alert('Invalid confirmation key was entered.');
      return;
    }

    await importKey(
      this.props.net2Client[net],
      net === Net.Mainnet ? this.state.mainnetSecretKey : this.state.testnetSecretKey
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

    // Should we store all the secret keys (on main net) in localStorage in the browser?
    // This carries the risk of phishing attacks/scammers to fool the end-user to fetch the
    // data from local storage through the users browser console. But it might save the user
    // if they lose the generated PDF.
  }

  private sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
