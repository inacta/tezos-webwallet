import { IPaymentStatus, Net, TransactionState } from './shared/TezosTypes';
import { ValidationResult, validateAddress } from '@taquito/utils';
import BigNumber from 'bignumber.js';
import { IInfoMessage } from './shared/OtherTypes';
import { InfoMessage } from './shared/components/InfoMessage';
import { PaymentStatus } from './shared/components/PaymentStatus';
import React from 'react';
import { TezosToolkit } from '@taquito/taquito';
import { TransferParams } from '@taquito/taquito/dist/types/operations/types';
import { conversionFactor } from './numbers';

export interface IAccountCardProps {
  client: TezosToolkit; // holds both secret key and address
  net: Net;
}

interface IAccountCardState {
  // Undefined balances means that they are not known/not loaded yet
  contractAddress: string;
  infoMessage: IInfoMessage | undefined;
  loading: boolean;
  ownAddress: string;
  paymentStatus: IPaymentStatus | undefined;
  recipient: string;
  tezosBalance: BigNumber | undefined;
  tokenBalance: BigNumber | undefined;
  transferAmount: BigNumber;
  transferAmountString: string;
}

export class AccountCard extends React.Component<IAccountCardProps, IAccountCardState> {
  public constructor(props: IAccountCardProps) {
    super(props);
    this.state = {
      contractAddress: '',
      infoMessage: undefined,
      loading: false,
      ownAddress: '',
      paymentStatus: undefined,
      recipient: '',
      tezosBalance: undefined,
      tokenBalance: undefined,
      transferAmount: new BigNumber(0),
      transferAmountString: ''
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
    let paymentStatusElement = this.state.paymentStatus && <PaymentStatus {...this.state.paymentStatus} />;

    // Info infoMessage is not undefined, show an info message element and the associated class
    const infoMessageElement = <InfoMessage {...this.state.infoMessage} />;

    // Show the token balance if one is set
    const tokenBalanceElem = this.state.tokenBalance && (
      <p className="card-text">{`${this.state.tokenBalance?.toString()} tokens`}</p>
    );

    // A valid contract address starts with 'KT1'
    const validContractAddress =
      this.state.contractAddress === '' ||
      (validateAddress(this.state.contractAddress) === ValidationResult.VALID &&
        this.state.contractAddress.substring(0, 3) === 'KT1');
    const validRecipient = validateAddress(this.state.recipient) === ValidationResult.VALID;
    return (
      <div className="card account-card">
        <div className="card-body">
          <h5 className="card-title">{`${
            this.props.net === Net.Mainnet ? 'Mainnet ' : 'Carthage Testnet'
          }   account`}</h5>
          <h6 className="card-subtitle mb-2 text-muted">{this.state.ownAddress}</h6>
          {infoMessageElement}
          <button
            className="btn btn-link"
            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
              // I am not sure why preventDefault is needed here, but it is!!
              e.preventDefault();
              this.updateBalance();
            }}
          >
            Update balance
          </button>
          <p className="card-text">{`${this.state.tezosBalance?.toString()} ꜩ`}</p>
          {tokenBalanceElem}
          <form>
            <div className="form-group">
              <label htmlFor="send-contract-address-input">Contract address</label>
              <input
                id="send-contract-address-input"
                type="text"
                className={`form-control ${!validContractAddress && 'is-invalid'}`}
                placeholder="Contract address"
                value={this.state.contractAddress}
                // set token balance to undefined each time field is changed to
                // ensure that stale values (e.g. for other tokens) is not presented
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  this.setState({ contractAddress: e.target.value, tokenBalance: undefined })
                }
                aria-label="Recipient address"
              />
              <small className="form-text text-muted">Leave blank to transfer Tezos</small>
            </div>
            <div className="form-group">
              <label htmlFor="send-recipient-input">Recipient</label>
              <input
                id="send-recipient-input"
                type="text"
                className={`form-control ${!validRecipient && 'is-invalid'}`}
                placeholder="Recipient"
                value={this.state.recipient}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.setState({ recipient: e.target.value })}
                aria-label="Recipient address"
              />
            </div>
            <div className="row">
              <div className="form-group col-lg-6">
                <label htmlFor="send-amount-input">{`Amount in ${
                  validContractAddress && this.state.contractAddress !== '' ? 'tokens' : 'ꜩ'
                }`}</label>
                <input
                  aria-label="Transfer amount"
                  id="send-amount-input"
                  type="text"
                  className="form-control"
                  placeholder="Amount"
                  value={this.state.transferAmountString}
                  onChange={(e) => this.updateTransferAmount(e.target.value)}
                />
              </div>
            </div>
            <button
              className="btn btn-primary"
              disabled={!this.canSend(validRecipient)}
              onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                e.preventDefault();
                this.makeTransaction();
              }}
            >
              Send
            </button>
            {paymentStatusElement}
          </form>
        </div>
      </div>
    );
  }

  private canSend(validRecipient: boolean): boolean {
    return (
      this.isValidAmount() &&
      validRecipient &&
      !this.state.loading &&
      (this.state.contractAddress === '' || validateAddress(this.state.contractAddress) === ValidationResult.VALID)
    );
  }

  private isValidAmount(): boolean {
    if (validateAddress(this.state.contractAddress) === ValidationResult.VALID) {
      // handle token transfer
      return (
        this.state.tezosBalance !== undefined &&
        this.state.tokenBalance !== undefined &&
        this.state.tokenBalance.isGreaterThanOrEqualTo(this.state.transferAmount) &&
        this.state.tezosBalance.isGreaterThanOrEqualTo(this.estimateTezosTransferFee()) &&
        this.state.transferAmount.isGreaterThan(new BigNumber(0))
      );
    } else {
      // handle tezos transfer
      return (
        this.state.tezosBalance !== undefined &&
        this.state.tezosBalance.isGreaterThanOrEqualTo(
          this.state.transferAmount.plus(this.estimateTezosTransferFee())
        ) &&
        this.state.transferAmount.isGreaterThan(new BigNumber(0))
      );
    }
  }

  private estimateTezosTransferFee(): BigNumber {
    // 0.05 tezi is default tx fee cf. https://www.reddit.com/r/tezos/comments/904gjd/transaction_fees/
    return new BigNumber(0.05);
  }

  private updateTransferAmount(amountString: string) {
    // Tezi amounts use a precision 1e-6
    const regexString = `^(0|[1-9][0-9]{0,10})(\\.([0-9]{0,6}))?$`;
    const decimalRegex = new RegExp(regexString);
    if (amountString !== '' && !decimalRegex.test(amountString)) {
      return;
    }

    let amount: BigNumber = new BigNumber(0);
    try {
      amount = new BigNumber(amountString);
    } catch (error) {
      // continue regardless of error
    }

    this.setState({ transferAmount: amount, transferAmountString: amountString });
  }

  private makeTransaction() {
    this.setState({ loading: true }, () => this.makeTransactionH());
  }

  private makeTransactionH() {
    if (this.state.contractAddress === '') {
      // Handle tezos transfer
      const transferParams: TransferParams = {
        amount: this.state.transferAmount.toNumber(),
        to: this.state.recipient
      };
      this.props.client.contract.transfer(transferParams).then((op) => {
        let paymentStatus: IPaymentStatus = {
          clearCallback: () => this.setState({ paymentStatus: undefined }),
          hash: undefined,
          message: `Waiting for ${op.hash} to be confirmed`,
          net: this.props.net,
          state: TransactionState.waiting
        };
        this.setState({ paymentStatus });
        return op.confirmation(1).then(() => {
          paymentStatus = {
            clearCallback: () => this.setState({ paymentStatus: undefined }),
            hash: op.hash,
            message: `${op.hash} successfully confirmed!`,
            net: this.props.net,
            state: TransactionState.success
          };
          this.setState({ paymentStatus, loading: false }, () => this.updateBalance());
        });
      });
    } else if (validateAddress(this.state.contractAddress) === ValidationResult.VALID) {
      // Handle token transfer
      this.props.client.contract
        .at(this.state.contractAddress)
        .then((contract) => {
          return contract.methods
            .transfer(this.state.ownAddress, this.state.recipient, this.state.transferAmount)
            .send();
        })
        .then((op) => {
          let paymentStatus: IPaymentStatus = {
            clearCallback: () => this.setState({ paymentStatus: undefined }),
            hash: undefined,
            message: `Waiting for ${op.hash} to be confirmed`,
            net: this.props.net,
            state: TransactionState.waiting
          };
          this.setState({ paymentStatus });
          return op.confirmation(1).then(() => {
            paymentStatus = {
              clearCallback: () => this.setState({ paymentStatus: undefined }),
              hash: op.hash,
              message: `${op.hash} successfully confirmed!`,
              net: this.props.net,
              state: TransactionState.success
            };
            this.setState({ paymentStatus, loading: false }, () => this.updateBalance());
          });
        })
        .catch((error) =>
          this.setState({
            infoMessage: {
              clearCallback: () => this.setState({ infoMessage: undefined }),
              message: `Sending failed: ${error.message}`,
              class: 'alert-danger'
            }
          })
        );
    } else {
      this.setState({
        infoMessage: {
          clearCallback: () => this.setState({ infoMessage: undefined }),
          message: 'Bad value for contract address',
          class: 'alert-danger'
        }
      });
    }
  }

  private async updateBalance() {
    this.props.client.rpc
      .getBalance(this.state.ownAddress)
      .then((muBalance) => this.setState({ tezosBalance: muBalance.dividedBy(conversionFactor) }));

    // If we are handling tezos (i.e. contract address not set to a valid address), only get one balance.
    if (validateAddress(this.state.contractAddress) !== ValidationResult.VALID) {
      return;
    }

    // Adapted from https://tezostaquito.io/docs/smartcontracts
    try {
      this.props.client.contract.at(this.state.contractAddress).then((c) => {
        // I could only get this to work by using any here. So we allow that locally
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        c.storage().then((s: any) =>
          s.ledger.get(this.state.ownAddress).then((s) =>
            // s will be undefined here iff address has not interacted with token (has never had a balance)
            this.setState({ tokenBalance: s?.balance === undefined ? new BigNumber(0) : new BigNumber(s.balance) })
          )
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
}
