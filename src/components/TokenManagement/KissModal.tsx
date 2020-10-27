import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import { checkAddress } from '../../shared/TezosUtil';
import { registerTandemClaim } from '../../shared/TezosService';
import { addNotification } from '../../shared/NotificationService';
import Loading from '../shared/Loading/Loading';

// We simply just want to be able to call the endpoint
// "register_tandem_claims". For this, we already have
// the private key, and our own address so we basically
// just need to be able to create a tandem object and
// send this to the relevant smart contract and show
// some nice graphic about the handling of the transaction
interface IKissModalProps {
  balance: number;
  balanceCallback: () => void;
  contractAddress: string;
  hideModal: () => void;
  show: boolean;
  symbol: string;
}

interface IKissModalState {
  activities: number[];
  activityLogContractAddress: string;
  calculatingFee: boolean;
  fee: number; // tez to be paid in fees to publish this tx
  helpers: string[];
  loading: boolean;
  minutes: number;
}

export class KissModal extends React.Component<IKissModalProps, IKissModalState> {
  private constructor(props: IKissModalProps) {
    super(props);
    this.state = {
      activities: [0],
      activityLogContractAddress: '',
      calculatingFee: false,
      fee: 0,
      helpers: [''],
      loading: false,
      minutes: 0
    };
  }

  private async handleSubmitHelper() {
    registerTandemClaim(
      this.props.contractAddress,
      this.state.activityLogContractAddress,
      this.state.helpers,
      this.state.minutes,
      this.state.activities,
      this.props.hideModal,
      this.props.balanceCallback
    )
      .catch((e) => {
        if (e.message === 'rejected') {
          console.error(JSON.stringify(e));
          addNotification('danger', 'The user rejected the transaction');
        } else if (e.message === 'RECEIVER_NOT_WHITELISTED') {
          console.error(JSON.stringify(e));
          addNotification('danger', 'The recipient is not whitelisted');
        } else {
          console.error(JSON.stringify(e));
          addNotification('danger', 'An error occurred');
        }
      })
      .finally(() => this.setState({ loading: false }));
  }

  // TODO: We probably want to make the promise resolve to the TXID
  private async handleSubmit(event: React.FormEvent): Promise<void> {
    // prevent the default behaviour of the form (prevents the browser from issuing a POST request)
    event.preventDefault();
    this.setState({ loading: true }, () => this.handleSubmitHelper());
  }

  private reset() {
    this.setState({ activities: [] });
    this.setState({ helpers: [] });
    this.setState({ minutes: 0 });
  }

  private updateActivities(activity: string) {
    this.setState({ activities: [parseInt(activity)] });
  }

  private updateActivityLogContractAddress(address: string) {
    this.setState({ activityLogContractAddress: address });
  }

  private updateHelpers(helper: string): void {
    this.setState({ helpers: [helper] });
  }

  private updateMinutes(minutesStr: string): void {
    this.setState({ minutes: parseInt(minutesStr) });
  }

  private valid(): boolean {
    return (
      this.validMinutes() &&
      this.state.activities.length === 1 &&
      this.state.helpers.length === 1 &&
      this.validRecipients()
    );
  }

  private validActivities(): boolean {
    return this.state.activities.length > 0;
  }

  private validMinutes(): boolean {
    return this.state.minutes > 0;
  }

  private validRecipients(): boolean {
    return this.state.helpers.length > 0 && this.state.helpers.every((x) => checkAddress(x) === '');
  }

  public render() {
    const helpers: JSX.Element = (
      <Form.Group as={Col} md="8" controlId="helper">
        <Form.Label>Helper</Form.Label>
        <Form.Control
          type="text"
          placeholder="Tezos address"
          value={this.state.helpers[0]}
          onChange={(e) => this.updateHelpers(e.target.value)}
          className={checkAddress(this.state.helpers[0]) !== '' ? 'is-invalid' : ''}
          required
        ></Form.Control>
        <Form.Control.Feedback type="invalid">{checkAddress(this.state.helpers[0])}</Form.Control.Feedback>
      </Form.Group>
    );

    // TODO: Should this be a list of checkboxes or something different?
    const activityinput: JSX.Element = (
      <Form.Group as={Col} md="8" controlId="activity">
        <Form.Label>Activity</Form.Label>
        <Form.Control
          type="text"
          placeholder="Activity"
          value={this.state.activities[0]}
          onChange={(e) => this.updateActivities(e.target.value)}
          className={this.validActivities() ? '' : 'is-invalid'}
          required
        ></Form.Control>
        <Form.Control.Feedback type="invalid">
          {this.validActivities() ? '' : 'Please select valid activites for this tandem'}
        </Form.Control.Feedback>
      </Form.Group>
    );

    const activityLogInput: JSX.Element = (
      <Form.Group as={Col} md="8" controlId="activity-log">
        <Form.Label>Activity log address</Form.Label>
        <Form.Control
          type="text"
          placeholder="Tezos address"
          value={this.state.activityLogContractAddress}
          onChange={(e) => this.updateActivityLogContractAddress(e.target.value)}
          className={checkAddress(this.state.activityLogContractAddress) !== '' ? 'is-invalid' : ''}
          required
        ></Form.Control>
        <Form.Control.Feedback type="invalid">
          {checkAddress(this.state.activityLogContractAddress)}
        </Form.Control.Feedback>
      </Form.Group>
    );

    const minuteInput: JSX.Element = (
      <Form.Group as={Col} md="4" controlId="minutes">
        <Form.Label>Minutes</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Amount"
            value={this.state.minutes}
            onChange={(e) => this.updateMinutes(e.target.value)}
            required
            className={this.validMinutes() ? '' : 'is-invalid'}
          ></Form.Control>
          <InputGroup.Append>
            <InputGroup.Text>{this.props.symbol}</InputGroup.Text>
          </InputGroup.Append>
          <Form.Control.Feedback type="invalid">{''}</Form.Control.Feedback>
        </InputGroup>
        <Form.Text className="text-muted">
          {this.state.calculatingFee
            ? `Calculating fee...`
            : this.state.fee > 0 && this.validMinutes() && this.validRecipients()
            ? `Fee for this transaction : ${this.state.fee} ꜩ`
            : ''}
        </Form.Text>
      </Form.Group>
    );

    return (
      <Modal
        show={this.props.show}
        centered
        size="lg"
        onHide={() => this.props.hideModal()}
        onSubmit={(e) => this.handleSubmit(e)}
        onEntered={() => this.reset()}
      >
        <Modal.Header closeButton>
          <Modal.Title>Register Tandem</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={this.valid()} id="register-tandem-form">
            <Form.Row>
              {helpers}
              {activityLogInput}
              {minuteInput}
            </Form.Row>
            <Form.Row>{activityinput}</Form.Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.props.hideModal()}>
            Close
          </Button>
          {this.state.loading ? (
            <Loading />
          ) : (
            <Button variant="primary" form="register-tandem-form" type="submit" disabled={!this.valid()}>
              Send
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
  }
}
