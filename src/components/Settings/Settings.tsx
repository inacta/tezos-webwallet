import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setRPCProvider } from '../../redux/actions';
import { Net } from '../../shared/TezosTypes';
import { Link } from 'react-router-dom';
import { FiArrowLeftCircle } from 'react-icons/fi';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import { EnumDictionary } from '../../shared/AbstractTypes';
import { addNotification } from '../../shared/NotificationService';

interface ISettings {
  network: Net;
  rpc: EnumDictionary<Net, string>;
  setRPCProvider: (network: Net, rpc: string) => void;
}

interface ISettingsState {
  rpc: string;
}

class Settings extends Component<ISettings, ISettingsState> {
  constructor(props: ISettings) {
    super(props);

    this.state = {
      rpc: props.rpc[props.network]
    };
  }

  saveSettings = () => {
    this.props.setRPCProvider(this.props.network, this.state.rpc);
    addNotification('success', 'Settings saved successfully');
  };

  render() {
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

let mapStateToProps = function(state) {
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
