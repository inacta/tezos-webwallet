import { IPaymentStatus, TransactionState } from './../TezosTypes';
import { Net } from '../TezosTypes';
import React from 'react';

// Can be rewritten as a functional component
export class PaymentStatus extends React.Component<IPaymentStatus, {}> {
  public render() {
    if (this.props === undefined) {
      return null;
    }

    let alertClass: string;
    switch (this.props.state) {
      case TransactionState.waiting:
        alertClass = 'alert-info';
        break;
      case TransactionState.success:
        alertClass = 'alert-success';
        break;
      case TransactionState.failed:
        alertClass = 'alert-danger';
        break;
      default:
        throw new Error('Unknown payment state');
    }

    let blockExplorerElem: JSX.Element | undefined = undefined;
    if (this.props.hash !== undefined) {
      const blockExplorerLink =
        this.props.net === Net.Mainnet
          ? `https://tzstats.com/${this.props.hash}`
          : `https://carthage.tzkt.io/${this.props.hash}`;
      blockExplorerElem = (
        <a href={blockExplorerLink} target="_blank" rel="noopener noreferrer">
          {' '}
          See the transaction
        </a>
      );
    }

    const statusElement: JSX.Element = (
      <div className={`alert ${alertClass}`} role="alert">
        <button
          className="close"
          onClick={() => (this.props.clearCallback === undefined ? void 0 : this.props.clearCallback())}
          aria-label="close"
          title="close"
        >
          x
        </button>
        <dl>
          <dt>Hash</dt>
          <dd>{this.props.hash}</dd>
          <dt>Link to block explorer</dt>
          <dd>{blockExplorerElem}</dd>
          <dt>Message</dt>
          <dd>{this.props.message}</dd>
          <dt>State</dt>
          <dd>{this.props.state}</dd>
        </dl>
      </div>
    );

    return statusElement;
  }
}
