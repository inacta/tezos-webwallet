import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Loading from '../shared/Loading/Loading';
import Modal from 'react-bootstrap/Modal';
import React from 'react';
import { addNotification } from '../../shared/NotificationService';
import { checkAddress } from '../../shared/TezosUtil';
import { registerTandemUserClaim } from '../../shared/TezosService';

// We simply just want to be able to call the endpoint
// "register_tandem_claims". For this, we already have
// the private key, and our own address so we basically
// just need to be able to create a tandem object and
// send this to the relevant smart contract and show
// some nice graphic about the handling of the transaction
interface IKissModalUserProps {
  balance: number;
  tokenBalanceCallback: () => void;
  contractAddress: string;
  hideModal: () => void;
  show: boolean;
  symbol: string;
}

interface IKissModalUserState {
  activities: number[];
  calculatingFee: boolean;
  fee: number; // tez to be paid in fees to publish this tx
  helpers: string[];
  loading: boolean;
  minutes: number;
}

export class KissModalUser extends React.Component<IKissModalUserProps, IKissModalUserState> {
  private constructor(props: IKissModalUserProps) {
    super(props);
    this.state = {
      activities: [0],
      calculatingFee: false,
      fee: 0,
      helpers: [''],
      loading: false,
      minutes: 0
    };
  }

  private async handleSubmitHelper() {
    registerTandemUserClaim(
      this.props.contractAddress,
      this.state.helpers,
      this.state.minutes,
      this.state.activities,
      this.props.hideModal,
      this.props.tokenBalanceCallback
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
        onSubmit={(e: React.FormEvent) => this.handleSubmit(e)}
        onEntered={() => this.reset()}
      >
        <Modal.Header closeButton>
          <Modal.Title>Register Tandem</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={this.valid()} id="register-tandem-form">
            <Form.Row>
              {helpers}
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