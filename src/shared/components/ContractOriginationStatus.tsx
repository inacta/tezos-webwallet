import { IContractOriginationStatus, TransactionState } from '../TezosTypes';
import React from 'react';

// Can be rewritten as a functional component
export class ContractOriginationStatus extends React.Component<IContractOriginationStatus, {}> {
  public render() {
    if (this.props?.hash === undefined) {
      return undefined;
    }

    let alertClass: string = undefined;
    switch (this.props.state) {
      case TransactionState.waiting:
        alertClass = 'alert-info';
        break;
      case TransactionState.failed:
        alertClass = 'alert-danger';
        break;
      case TransactionState.success:
        alertClass = 'alert-success';
        break;
      default:
        throw new Error('Unknown transaction state for ContractOriginationStatus');
    }

    return this.props.hash === undefined ? null : (
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
          <dt>Address of new Contract</dt>
          <dd>{this.props.addressOfNewContract}</dd>
          <dt>Deployed in transaction</dt>
          <dd>{this.props.hash}</dd>
          <dt>State</dt>
          <dd>{this.props.state}</dd>
        </dl>
      </div>
    );
  }
}
