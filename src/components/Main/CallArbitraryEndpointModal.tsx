import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { Net } from '../../shared/TezosTypes';
import { arbitraryFunctionCall, getContract } from '../../shared/TezosService';
import { checkAddress, getContractInterface } from '../../shared/TezosUtil';
import { EnumDictionary } from '../../shared/AbstractTypes';
import { TezosToolkit, ContractAbstraction, ContractProvider, WalletContract } from '@taquito/taquito';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Loading from '../shared/Loading/Loading';
import { addNotification } from '../../shared/NotificationService';

interface ICallArbitraryEndpointModalProps {
  balanceCallback: () => void;
  hideModal: () => void;
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  showModal: boolean;
}

interface ICallArbitraryEndpointModalState {
  args: string[];
  contract: ContractAbstraction<ContractProvider> | undefined;
  contractAddress: string;
  endpointName: string;
  numberOfArgs: number | undefined;
  numberOfArgsString: string;
  processingFunctionCall: boolean;
}

export class CallArbitraryEndpointModal extends React.Component<
  ICallArbitraryEndpointModalProps,
  ICallArbitraryEndpointModalState
> {
  private constructor(props: ICallArbitraryEndpointModalProps) {
    super(props);
    this.state = {
      args: [] as string[],
      contractAddress: '',
      contract: undefined,
      endpointName: '',
      numberOfArgs: undefined,
      numberOfArgsString: '',
      processingFunctionCall: false
    };
  }

  public componentDidUpdate(prevProps: ICallArbitraryEndpointModalProps, prevState: ICallArbitraryEndpointModalState) {
    // Ensure that number of arguments in state matches the provided number in numberOfArgs
    if (prevState.numberOfArgs !== this.state.numberOfArgs) {
      let args: string[] = new Array(this.state.numberOfArgs || 0);
      args.fill('');
      this.setState({ args });
    }
  }

  private handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    this.setState({ processingFunctionCall: true }, () => this.handleSubmitH());
  }

  private handleSubmitH() {
    arbitraryFunctionCall(
      this.state.contract,
      this.state.endpointName,
      this.state.args,
      this.props.hideModal,
      this.props.balanceCallback
    )
      .catch((e) => {
        console.error(e.message);
        console.error(JSON.stringify(e));
        addNotification('danger', `An error occurred: ${e.message}`);
      })
      .finally(() => this.setState({ processingFunctionCall: false }));
  }

  private isValidEndpoint(): boolean {
    // The endpoint is valid if a contract has been loaded and the
    // endpoint name matches a function in the loaded contract
    return this.state.contract && getContractInterface(this.state.contract)[2].includes(this.state.endpointName);
  }

  private isValidNumArgs(): boolean {
    return typeof this.state.numberOfArgs !== 'undefined';
  }

  private isJsonString(str: string): boolean {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  private range(length: number): number[] {
    let res = [];
    for (let i = 0; i < length; i++) {
      res.push(i);
    }

    return res;
  }

  private updateArgs(val: string, index: number): void {
    // I think this is a correct way of updating an array in a state, cf.
    // https://stackoverflow.com/questions/29537299/react-how-to-update-state-item1-in-state-using-setstate
    const args = [...this.state.args];
    args[index] = val;
    this.setState({ args });
  }

  private async updateContractAddressH(input: string): Promise<void> {
    const contract: ContractAbstraction<ContractProvider> | WalletContract | undefined = await getContract(input);
    this.setState({ contract: contract as ContractAbstraction<ContractProvider> | undefined });
  }

  private updateContractAddress(input: string): void {
    this.setState({ contractAddress: input }, () => this.updateContractAddressH(input));
  }

  private updateNumberOfArgs(numberString: string): void {
    this.setState({ numberOfArgsString: numberString });
    try {
      const newVal: number = parseInt(numberString);
      if (!isNaN(newVal)) {
        this.setState({ numberOfArgs: newVal });
      } else {
        this.setState({ numberOfArgs: undefined });
      }
    } catch (error) {
      console.log(error.message);
      this.setState({ numberOfArgs: undefined });
    }
  }

  private valid(): boolean {
    return this.isValidEndpoint() && this.state.args.every((x) => this.isJsonString(x)) && this.isValidNumArgs();
  }

  public render() {
    const argsInputs: JSX.Element[] = this.range(this.state.numberOfArgs || 0).map((i) => (
      <Form.Group controlId={`arg-${i.toString()}`} key={i}>
        <Form.Label>{`Argument ${(i + 1).toString()} as JSON`}</Form.Label>
        <Form.Control
          as="textarea"
          className={this.isJsonString(this.state.args[i]) ? '' : 'is-invalid'}
          onChange={(e) => this.updateArgs(e.target.value, i)}
          rows={1}
          value={this.state.args[i]}
        />
      </Form.Group>
    ));

    const endpointNameInput: JSX.Element = (
      <Form.Group controlId="endpoint-name">
        <Form.Label>Endpoint name</Form.Label>
        <Form.Control as="select" onChange={(e) => this.setState({ endpointName: e.target.value })}>
          {this.state.contract &&
            getContractInterface(this.state.contract)[2].map((name, i) => <option key={i}>{name}</option>)}
        </Form.Control>
      </Form.Group>
    );

    return (
      <Modal
        centered
        show={this.props.showModal}
        size="lg"
        onSubmit={(e) => this.handleSubmit(e)}
        onHide={() => this.props.hideModal()}
      >
        <Modal.Header closeButton>
          <Modal.Title>Call function in a deployed smart contract</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate id="arbitrary-call-form">
            <Form.Group controlId="contract-address">
              <Form.Label>Contract address</Form.Label>
              <Form.Control
                className={checkAddress(this.state.contractAddress) === '' ? '' : 'is-invalid'}
                onChange={(e) => this.updateContractAddress(e.target.value)}
                type="text"
                value={this.state.contractAddress}
              />
              {endpointNameInput}
            </Form.Group>
            <Form.Group controlId="number-of-args">
              <Form.Label>Number of arguments</Form.Label>
              <Form.Control
                className={this.isValidNumArgs() ? '' : 'is-invalid'}
                type="text"
                onChange={(e) => this.updateNumberOfArgs(e.target.value)}
              />
            </Form.Group>
            {argsInputs}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.props.hideModal()}>
            Close
          </Button>
          {this.state.processingFunctionCall ? (
            <Loading />
          ) : (
            <Button variant="primary" disabled={!this.valid()} form="arbitrary-call-form" type="submit">
              Make function call
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
  }
}
