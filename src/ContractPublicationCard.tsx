/* eslint-disable no-console */
import { IContractOriginationStatus, Net, TransactionState } from './shared/TezosTypes';
import BigNumber from 'bignumber.js';
import { ContractOriginationStatus } from './shared/components/ContractOriginationStatus';
import { IInfoMessage } from './shared/OtherTypes';
import { InfoMessage } from './shared/components/InfoMessage';
import React from 'react';
import { TezosToolkit } from '@taquito/taquito';
import { conversionFactor } from './numbers';

interface IInstructionAttribute {
  int?: string;
  annots?: string[];
}

interface IContractElem {
  prim: string;
  args?: IContractElem[] | IInstructionAttribute[];
}

type ExpectedContractFormat = IContractElem[];

interface IContractPublicationCardProps {
  client: TezosToolkit;
  net: Net;
}

interface IContractPublicationCardState {
  balance: BigNumber | undefined;
  contractOriginationStatus: IContractOriginationStatus | undefined;
  infoMessage: IInfoMessage;
  michelsonInput: string;
  loading: boolean;
  ownAddress: string;
  parsedMichelson: ExpectedContractFormat | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsedStorage: any;
  storageInput: string;
}

// Use this component to publish Tezos smart contracts.
// This component requires that a valid private key is set
// on the client from props
export class ContractPublicationCard extends React.Component<
  IContractPublicationCardProps,
  IContractPublicationCardState
> {
  public constructor(props: IContractPublicationCardProps) {
    super(props);
    this.state = {
      balance: undefined,
      contractOriginationStatus: undefined,
      infoMessage: undefined,
      michelsonInput: '',
      loading: false,
      ownAddress: '',
      parsedMichelson: undefined,
      parsedStorage: undefined,
      storageInput: ''
    };
  }
  public componentDidMount() {
    // Set the address field from the private key,
    // and get the balance for this address from the rpc
    this.props.client.signer
      .publicKeyHash()
      .then((address) => this.setState({ ownAddress: address }, () => this.updateBalance()));
  }

  public render() {
    const infoMessageElement = <InfoMessage {...this.state.infoMessage} />;
    const contractOriginationStatusElement = this.state.contractOriginationStatus && (
      <ContractOriginationStatus {...this.state.contractOriginationStatus} />
    );
    return (
      <div>
        <div className="row">
          <div className="col-6">
            <p>{this.state.ownAddress}</p>
            <p>{`${this.state.balance?.toString()} ꜩ`}</p>
            {infoMessageElement}
            {contractOriginationStatusElement}
            <p>
              <b>{`Publish contract on ${this.props.net === Net.Mainnet ? 'mainnet' : 'Carthage testnet'}`}</b>
            </p>
          </div>
        </div>
        <div className="row">
          <form>
            <div className="form-group col-lg-12">
              <label htmlFor="michelson-json-input">Michelson code as JSON</label>
              <textarea
                className={`${this.state.parsedMichelson === undefined && 'is-invalid'}`}
                cols={100}
                id="michelson-json-input"
                name="textValue"
                onChange={(e) => this.handleCodeChange(e.target.value)}
                rows={25}
                value={this.state.michelsonInput}
              />
            </div>
            <div className="form-group col-lg-12">
              <label htmlFor="storage-json-input">Initial storage as JSON</label>
              <textarea
                className={`${this.state.parsedStorage === undefined && 'is-invalid'}`}
                cols={100}
                id="storage-json-input"
                name="textValue"
                onChange={(e) => this.handleStorageChange(e.target.value)}
                rows={10}
                value={this.state.storageInput}
              />
            </div>
            <div className="form-group col-lg-3">
              <button
                className="btn btn-primary"
                disabled={
                  this.state.parsedMichelson === undefined ||
                  this.state.parsedStorage === undefined ||
                  this.state.loading
                }
                onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                  e.preventDefault();
                  this.publish();
                }}
              >
                Publish
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  private publish() {
    this.setState({ loading: true }, () => this.publishH());
  }

  private publishH() {
    // Only publish if contract and storage look sane
    if (this.state.parsedMichelson === undefined || this.state.parsedStorage === undefined) {
      return;
    }

    this.props.client.contract
      .originate({
        code: this.state.parsedMichelson,
        init: this.state.parsedStorage
      })
      .then((originationOp) => {
        let contractOriginationStatus: IContractOriginationStatus = {
          addressOfNewContract: undefined,
          clearCallback: () => this.setState({ contractOriginationStatus: undefined }),
          hash: originationOp.hash,
          message: 'Publishing new smart contract',
          state: TransactionState.waiting
        };
        this.setState({ contractOriginationStatus });
        originationOp.contract().then((c) => {
          this.setState({ contractOriginationStatus }, () => {
            originationOp.confirmation(1).then(() => {
              contractOriginationStatus = {
                addressOfNewContract: c.address,
                clearCallback: () => this.setState({ contractOriginationStatus: undefined }),
                hash: originationOp.hash,
                message: `Contract successfully deployed`,
                state: TransactionState.success
              };
              this.setState({ contractOriginationStatus, loading: false }, () => this.updateBalance());
            });
          });
        });
      })
      .catch((error) => {
        this.setState(
          {
            loading: false,
            infoMessage: {
              class: 'alert-danger',
              clearCallback: () => this.setState({ infoMessage: undefined }),
              message: error.message
            }
          },
          () => this.updateBalance()
        );
      });
  }

  private parseCodeInput() {
    let parsed: ExpectedContractFormat;
    try {
      // Parsing success only means that input is valid JSON, not that
      // it matches the type of ExpectedContractFormat.
      // So we have to manually check that the required fields are not undefined.
      parsed = JSON.parse(this.state.michelsonInput);
    } catch (error) {
      this.setState({ parsedMichelson: undefined });
      return;
    }

    // Sanity check of parsed JSON: verify that it is an array and that it
    // looks like Michelson code
    if (parsed === undefined || parsed.constructor !== Array || typeof parsed[0].prim !== 'string') {
      this.setState({ parsedMichelson: undefined });
      return;
    }

    this.setState({ parsedMichelson: parsed });
  }

  private parseStorageInput() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(this.state.storageInput);
    } catch (error) {
      this.setState({ parsedStorage: undefined });
      return;
    }

    this.setState({ parsedStorage: parsed });
  }

  private handleCodeChange(input: string) {
    this.setState({ michelsonInput: input }, () => this.parseCodeInput());
  }

  private handleStorageChange(input: string) {
    this.setState({ storageInput: input }, () => this.parseStorageInput());
  }

  private async updateBalance() {
    this.props.client.rpc
      .getBalance(this.state.ownAddress)
      .then((muBalance) => this.setState({ balance: muBalance.dividedBy(conversionFactor) }));
  }
}
