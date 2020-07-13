import { IInfoMessage } from '../OtherTypes';
import React from 'react';

// Can be rewritten as a functional component
export class InfoMessage extends React.Component<IInfoMessage, {}> {
  public render() {
    return this.props.message === undefined ? null : (
      <div className={`alert ${this.props.class}`}>
        <button
          className="close"
          onClick={() => (this.props.clearCallback === undefined ? void 0 : this.props.clearCallback())}
          aria-label="close"
          title="close"
        >
          x
        </button>
        {this.props.message}
      </div>
    );
  }
}
