import React, { Component } from 'react';
import './Main.scss';
import { ValidationResult, validateAddress } from '@taquito/utils';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Switch from 'react-switch';
import { switchNetwork, changeAddress } from '../../redux/actions';
import { connect } from 'react-redux';
import { Net } from '../../shared/TezosTypes';
import { EnumDictionary } from '../../shared/AbstractTypes';

interface IMainProps {
  network: Net;

  accounts: EnumDictionary<Net, { address: string; privKey: string }>;

  switchNetwork: () => void;
  changeAddress: (address: string, network: Net) => void;
}

interface IMainState {
  addressError: string;
  address: { [network: string]: string };
}

class Main extends Component<IMainProps, IMainState> {
  public constructor(props: IMainProps) {
    super(props);

    this.state = {
      address: {
        [Net.Testnet]: '',
        [Net.Mainnet]: ''
      },
      addressError: ''
    };
  }

  render() {
    const check = (event) => {
      // get form value
      const formValue = event.currentTarget.value;
      // update form field
      this.setState((prevState) => {
        prevState.address[this.props.network] = formValue;
        return prevState;
      });
      // if form value is empty, delete the address from redux
      if (formValue === '') {
        this.setState({ addressError: '' });
        this.props.changeAddress(formValue, this.props.network);
        return;
      }
      // initiate address validation check
      const res = validateAddress(formValue);
      if (res === 0) {
        this.setState({ addressError: 'Invalid Address: no prefix matched' });
      } else if (res === 1) {
        this.setState({ addressError: 'Invalid checksum' });
      } else if (res === 2) {
        this.setState({ addressError: 'Invalid length' });
      } else if (res === 3) {
        // if address is valid, update redux storage
        this.setState({ addressError: '' });
        this.props.changeAddress(formValue, this.props.network);
      }
    };

    return (
      <div>
        {/* TITLE + TOGGLE */}
        <Row>
          <Col sm={6} className="mb-4">
            <h2 style={{ whiteSpace: 'nowrap' }}>
              Tezos
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="32"
                viewBox="0 0 47 64"
                style={{ marginLeft: '5px' }}
              >
                <path
                  fill="#000000"
                  d="M30.252 63.441c-4.55 0-7.864-1.089-9.946-3.267-2.08-2.177-3.121-4.525-3.121-7.041 0-.92.181-1.694.544-2.323a3.993 3.993 0 0 1 1.489-1.489c.629-.363 1.403-.544 2.323-.544.92 0 1.693.181 2.323.544.629.363 1.125.86 1.488 1.489.363.629.544 1.403.544 2.323 0 1.113-.266 2.02-.798 2.722-.533.702-1.162 1.161-1.888 1.38.63.87 1.622 1.487 2.977 1.85 1.355.388 2.71.581 4.065.581 1.887 0 3.593-.508 5.118-1.524 1.524-1.017 2.65-2.517 3.376-4.501.726-1.984 1.089-4.235 1.089-6.752 0-2.734-.4-5.07-1.198-7.005-.775-1.96-1.924-3.412-3.449-4.356a9.21 9.21 0 0 0-4.936-1.415c-1.162 0-2.613.484-4.356 1.452l-3.194 1.597v-1.597L37.076 16.4H17.185v19.89c0 1.646.363 3.001 1.089 4.066s1.839 1.597 3.34 1.597c1.16 0 2.274-.387 3.339-1.162a11.803 11.803 0 0 0 2.758-2.83c.097-.219.218-.376.363-.473a.723.723 0 0 1 .472-.181c.266 0 .58.133.944.4.339.386.508.834.508 1.342a9.243 9.243 0 0 1-.182 1.017c-.822 1.839-1.96 3.242-3.412 4.21a8.457 8.457 0 0 1-4.79 1.452c-4.308 0-7.285-.847-8.93-2.54-1.645-1.695-2.468-3.994-2.468-6.897V16.4H.052v-3.703h10.164v-8.42L7.893 1.952V.066h6.751l2.54 1.306v11.325l26.28-.072 2.614 2.613-16.116 16.116a10.807 10.807 0 0 1 3.049-.726c1.742 0 3.702.557 5.88 1.67 2.202 1.089 3.896 2.59 5.081 4.5 1.186 1.888 1.948 3.703 2.287 5.445.363 1.743.545 3.291.545 4.646 0 3.098-.654 5.977-1.96 8.64-1.307 2.661-3.291 4.645-5.953 5.952-2.662 1.307-5.542 1.96-8.639 1.96z"
                />
              </svg>
            </h2>
          </Col>
          <Col sm={6} className="mb-3">
            <div className="Main-buttongroup d-flex mt-3 justify-content-end align-items-center">
              <span className="mr-1">{Net.Testnet}</span>
              <Switch
                className="mr-1"
                onChange={() => this.props.switchNetwork()}
                checked={this.props.network === Net.Mainnet}
                checkedIcon={false}
                uncheckedIcon={false}
                offColor="#999999"
                onColor="#9bbf73"
                height={20}
                width={40}
                handleDiameter={14}
              />
              <span>{Net.Mainnet}</span>
            </div>
          </Col>
        </Row>
        {/* ADDRESS INPUT */}
        <Row>
          <Col>
            <p>
              {this.props.network === Net.Mainnet
                ? 'You are using the mainnet, be careful when interacting with the blockchain to prevent the loss of funds.'
                : 'You are using the Carthage testnet.'}
            </p>
            <Form>
              <Form.Group>
                <Form.Control
                  placeholder="Enter your address or add a wallet"
                  onChange={check}
                  value={this.state.address[this.props.network]}
                />
                <Form.Text style={{ color: 'red' }}>{this.state.addressError}</Form.Text>
              </Form.Group>
            </Form>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <Button style={{ width: '100%' }}>New Wallet</Button>
          </Col>
          <Col>
            <Button style={{ width: '100%' }}>Import Wallet</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

let mapStateToProps = function(state) {
  return {
    network: state.network,
    accounts: state.accounts
  };
};

let mapDispatchToProps = {
  switchNetwork: switchNetwork,
  changeAddress: changeAddress
};

let MainContainer = connect(mapStateToProps, mapDispatchToProps)(Main);

export default MainContainer;
