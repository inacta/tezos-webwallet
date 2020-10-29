import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { IContractInformation, Net } from '../../shared/TezosTypes';
import { arbitraryFunctionCall, getContract } from '../../shared/TezosService';
import { checkAddress, isValidAddress, isContractAddress } from '../../shared/TezosUtil';
import { EnumDictionary } from '../../shared/AbstractTypes';
import { TezosToolkit, ContractAbstraction, ContractProvider, WalletContract } from '@taquito/taquito';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Loading from '../shared/Loading/Loading';
import { addNotification } from '../../shared/NotificationService';
import { getContractInformation } from '../../shared/TokenImplementation';

interface ICallArbitraryEndpointModalProps {
  balanceCallback: () => void;
  hideModal: () => void;
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  showModal: boolean;
}

interface ICallArbitraryEndpointModalState {
  args: string[];
  contractInformation: IContractInformation | undefined;
  contractAddress: string;
  endpointName: string;
  numberOfArgs: number | undefined;
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
      contractInformation: undefined,
      endpointName: '',
      numberOfArgs: undefined,
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
      this.state.contractInformation.contract,
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
    if (!this.state.contractInformation) {
      return false;
    }

    return this.state.contractInformation.methods.includes(this.state.endpointName);
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

  private isValidType(input: string, type: string): boolean {
    if (!input || !type) {
      return false;
    }

    switch (type) {
      case 'nat':
        return /^\d+$/.test(input) && this.isJsonString(input);
      case 'address':
        return isValidAddress(input.slice(1, -1)) && this.isJsonString(input);
      default:
        return this.isJsonString(input);
    }
  }

  // Return the array [0 .. length - 1 ]
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
    let contractInformation: IContractInformation | undefined = undefined;
    if (contract) {
      contractInformation = await getContractInformation(contract as ContractAbstraction<ContractProvider>);
    }

    // Set contract information and numberOfArgs param to match number of methods found in deployed smart contract
    const firstMethod: string | undefined =
      (contractInformation?.methods.length ?? 0) > 0 ? contractInformation.methods[0] : undefined;
    this.setState({
      contractInformation,
      endpointName: firstMethod,
      numberOfArgs: contractInformation?.functionSignatures[firstMethod]?.length
    });
  }

  private updateContractAddress(input: string): void {
    this.setState({ contractAddress: input }, () => this.updateContractAddressH(input));
  }

  private updateEndpointName(name: string): void {
    const numberOfArgs: number = this.state.contractInformation?.functionSignatures[name]?.length;
    this.setState({ endpointName: name, numberOfArgs });
  }

  private valid(): boolean {
    return (
      this.isValidEndpoint() &&
      this.state.args.every((x, i) =>
        this.isValidType(x, this.state.contractInformation?.functionSignatures[this.state.endpointName][i])
      ) &&
      this.isValidNumArgs()
    );
  }

  public render() {
    const argsInputs: JSX.Element[] = this.range(this.state.numberOfArgs || 0).map((i) => (
      <Form.Group controlId={`arg-${i.toString()}`} key={i}>
        <Form.Label>{`Argument ${(i + 1).toString()} as JSON (${
          this.state.contractInformation?.functionSignatures[this.state.endpointName][i]
        })`}</Form.Label>
        <Form.Control
          as="textarea"
          className={
            this.isValidType(
              this.state.args[i],
              this.state.contractInformation?.functionSignatures[this.state.endpointName][i]
            )
              ? ''
              : 'is-invalid'
          }
          onChange={(e) => this.updateArgs(e.target.value, i)}
          rows={1}
          value={this.state.args[i]}
        />
      </Form.Group>
    ));

    // Show but disable endpoints for contract-to-contract interaction. These functions take 'contract' as input.
    const endpointNameInput: JSX.Element = (
      <Form.Group controlId="endpoint-name">
        <Form.Label>Endpoint name</Form.Label>
        <Form.Control as="select" onChange={(e) => this.updateEndpointName(e.target.value)}>
          {this.state.contractInformation &&
            this.state.contractInformation.methods.map((name, i) => {
              const c2c: boolean = this.state.contractInformation.functionSignatures[name].includes('contract');
              return (
                <option key={i} disabled={c2c}>
                  {`${name} ${c2c ? ' (contract-to-contract function)' : ''}`}
                </option>
              );
            })}
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
                className={isContractAddress(this.state.contractAddress) ? '' : 'is-invalid'}
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
                readOnly={true}
                value={this.state.numberOfArgs}
                type="text"
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
