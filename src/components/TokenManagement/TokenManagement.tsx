import { ITokenDetails, Net, TokenStandard } from '../../shared/TezosTypes';
import { Link, Redirect } from 'react-router-dom';
import React, { Component } from 'react';
import { EnumDictionary } from '../../shared/AbstractTypes';
import FA1_2Component from './FA1_2Component/FA1_2Component';
import FA2Component from './FA2Component/FA2Component';
import { FiArrowLeftCircle } from 'react-icons/fi';
import { IAccountState } from '../../redux/reducers/accounts';
import { IReduxState } from '../../redux/reducers/index';
import { ITokenState } from '../../redux/reducers/tokens';
import { TezosToolkit } from '@taquito/taquito';
import { connect } from 'react-redux';

interface ITokenManagementProps {
  network: Net;
  accounts: IAccountState;
  net2client: EnumDictionary<Net, TezosToolkit>;
  tokens: ITokenState;
  match: {
    params: {
      address: string;
    };
  };
}

class TokenManagement extends Component<ITokenManagementProps, {}> {
  private contractAddress: string;
  private token: ITokenDetails;

  public constructor(props: ITokenManagementProps) {
    super(props);
    this.contractAddress = this.props.match.params.address;
    this.token = this.props.tokens[this.props.network][this.contractAddress];
  }

  public render() {
    if (this.props.accounts[this.props.network].address === undefined || this.token === undefined) {
      return <Redirect to="/" />;
    }
    return (
      <div>
        <h3>
          <Link to="/" className="mr-2">
            <FiArrowLeftCircle className="align-bottom text-primary" />
          </Link>
          {this.token.name}
          <small>
            <span className="text-muted ml-2">{this.token.type === TokenStandard.FA1_2 ? 'FA1.2' : 'FA2'}</span>
          </small>
        </h3>
        <hr />
        {this.token.type === TokenStandard.FA1_2 ? (
          /* eslint-disable-next-line react/jsx-pascal-case */
          <FA1_2Component
            address={this.props.accounts[this.props.network].address ?? ''}
            contractAddress={this.contractAddress}
            token={this.token}
            showTransfer={this.props.accounts[this.props.network].signer !== undefined}
          />
        ) : (
          <FA2Component />
        )}
      </div>
    );
  }
}

let mapStateToProps = function(state: IReduxState) {
  return {
    network: state.network,
    accounts: state.accounts,
    net2client: state.net2client,
    tokens: state.tokens
  };
};

let mapDispatchToProps = {};

let TokenManagementContainer = connect(mapStateToProps, mapDispatchToProps)(TokenManagement);

export default TokenManagementContainer;
