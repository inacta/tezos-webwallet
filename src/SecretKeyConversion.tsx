import React from 'react';
import { TezosToolkit } from '@taquito/taquito';
import { importKey } from '@taquito/signer';

// Taken from faucet.tzalpha.net
interface IExpectedInputFormat {
  amount: string;
  email: string;
  mnemonic: string[];
  secret: string;
  pkh: string;
  password: string;
}

interface ISecretKeyConversionState {
  input: string;
  parsed: IExpectedInputFormat;
  secretKeyAsWif: string;
}

export class SecretKeyConversion extends React.Component<{}, ISecretKeyConversionState> {
  public constructor(props: {}) {
    super(props);
    this.state = {
      input: '',
      parsed: undefined,
      secretKeyAsWif: ''
    };
  }

  public render() {
    return (
      <div className="row">
        <form>
          <div className="form-group col-lg-6">
            <label htmlFor="secret-key-json-input">JSON input for secret key</label>
            <textarea
              className={`${this.state.parsed === undefined && 'is-invalid'}`}
              cols={50}
              id="secret-key-json-input"
              name="textValue"
              onChange={(e) => this.handleChange(e.target.value)}
              rows={25}
              value={this.state.input}
            />
          </div>
          <div className="form-group col-lg-6">
            <label htmlFor="converted-secret-key">Converted secret key</label>
            <input
              aria-label="Secret key for mainnet"
              className="form-control"
              id="converted-secret-key"
              type="text"
              readOnly={true}
              value={this.state.secretKeyAsWif}
            />
          </div>
          <button
            className="btn btn-primary"
            disabled={this.state.parsed === undefined}
            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
              e.preventDefault();
              this.getSecretKeyAsWif();
            }}
            placeholder="Converted secret key"
          >
            Convert
          </button>
        </form>
      </div>
    );
  }

  private deriveSecretKey(): void {
    let parsed: IExpectedInputFormat;
    try {
      // Parsing success only means that input is valid JSON, not that
      // it contains any of the fields in IExpectedInputFormat as this
      // type only exists at compile time. So we have to manually check
      // that the required fields are not undefined.
      parsed = JSON.parse(this.state.input);
    } catch (error) {
      this.setState({ parsed: undefined });
      return;
    }

    if (parsed.mnemonic === undefined) {
      this.setState({ parsed: undefined });
      return;
    }

    this.setState({ parsed });
  }

  private getSecretKeyAsWif() {
    const tezos = new TezosToolkit();
    importKey(
      tezos,
      this.state.parsed.email,
      this.state.parsed.password,
      this.state.parsed.mnemonic.join(' '),
      this.state.parsed.secret
    );

    tezos.signer.secretKey().then((secretKeyAsWif) => this.setState({ secretKeyAsWif }));
  }

  private handleChange(input: string) {
    this.setState({ input }, () => this.deriveSecretKey());
  }
}
