import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
import { EnumDictionary } from '../../shared/AbstractTypes';
import { FiArrowLeftCircle } from 'react-icons/fi';
import FormControl from 'react-bootstrap/FormControl';
import { IReduxState } from '../../redux/reducers/index';
import InputGroup from 'react-bootstrap/InputGroup';
import { Link } from 'react-router-dom';
import { Net } from '../../shared/TezosTypes';
import { addNotification } from '../../shared/NotificationService';
import { connect } from 'react-redux';
import { setRPCProvider } from '../../redux/actions';

interface ISettings {
  network: Net;
  rpc: EnumDictionary<Net, string>;
  setRPCProvider: (network: Net, rpc: string) => void;
}

interface ISettingsState {
  rpc: string;
}

class Settings extends Component<ISettings, ISettingsState> {
  public constructor(props: ISettings) {
    super(props);

    this.state = {
      rpc: props.rpc[props.network]
    };
  }

  private saveSettings = () => {
    this.props.setRPCProvider(this.props.network, this.state.rpc);
    addNotification('success', 'Settings saved successfully');
  };

  public render() {
    return (
      <div className="d-flex flex-column h-100">
        <div>
          <h2>
            <Link to="/" className="mr-2">
              <FiArrowLeftCircle />
            </Link>
          </h2>
          <hr />
        </div>
        <div className="flex-fill flex-grow-1">
          <h3>
            Set API / node URL
            <small className="text-muted ml-2">{this.props.network === Net.Mainnet ? 'Mainnet' : 'Testnet'}</small>
          </h3>
          <InputGroup className="mb-3">
            <FormControl
              placeholder="RPC URL"
              value={this.state.rpc}
              onChange={(e) => this.setState({ ...this.state, rpc: e.currentTarget.value })}
            />
          </InputGroup>
        </div>
        <div>
          <hr />
          <Button className="float-right" onClick={this.saveSettings}>
            Save
          </Button>
        </div>
      </div>
    );
  }
}

let mapStateToProps = function(state: IReduxState) {
  return {
    network: state.network,
    rpc: state.persistRPC
  };
};

let mapDispatchToProps = {
  setRPCProvider: setRPCProvider
};

let SettingsContainer = connect(mapStateToProps, mapDispatchToProps)(Settings);

export default SettingsContainer;
