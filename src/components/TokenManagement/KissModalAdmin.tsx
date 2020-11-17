import { FaMinusCircle, FaPlusCircle } from 'react-icons/fa';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import { IKissTandemAdminClaim } from '../../shared/KissTypes';
import IconButton from '../shared/IconButton/IconButton';
import Loading from '../shared/Loading/Loading';
import Modal from 'react-bootstrap/Modal';
import React from 'react';
import Row from 'react-bootstrap/Row';
import { addNotification } from '../../shared/NotificationService';
import { isValidAddress } from '../../shared/TezosUtil';
import { registerTandemAdminClaim } from '../../shared/TezosService';

interface IKissAdminClaimsInput {
  activities: string;
  helpees: string;
  helpers: string;
  minutes: string;
}

interface IKissModalAdminProps {
  balance: number;
  contractAddress: string;
  hideModal: () => void;
  show: boolean;
  symbol: string;
  tokenBalanceCallback: () => void;
}

interface IKissModalAdminState {
  calculatingFee: boolean;
  claims: IKissAdminClaimsInput[];
  fee: number; // tez to be paid in fees to publish this tx
  loading: boolean;
}

export class KissModalAdmin extends React.Component<IKissModalAdminProps, IKissModalAdminState> {
  private emptyClaimInput: IKissAdminClaimsInput = {
    activities: '',
    helpees: '',
    helpers: '',
    minutes: ''
  };

  private constructor(props: IKissModalAdminProps) {
    super(props);
    const emptyClaim = { ...this.emptyClaimInput };
    this.state = {
      // claims: [] as IKissTandemAdminClaim[],
      claims: [emptyClaim],
      calculatingFee: false,
      fee: 0,
      loading: false
    };
  }

  // The spread operator creates copies of the arrays and objects
  // so multiple entries in the claims array do not reference the same object instance.
  private updateField(
    event: React.ChangeEvent<HTMLInputElement>,
    i: number,
    type: 'helpers' | 'helpees' | 'activities' | 'minutes'
  ) {
    const newValue = event.currentTarget.value;
    const newArray = [...this.state.claims];
    newArray[i][type] = newValue;
    this.setState({ claims: newArray });
  }

  private addField(): void {
    const newArray = [...this.state.claims];
    const newClaim = { ...this.emptyClaimInput };
    newArray.push(newClaim);
    this.setState({ claims: newArray });
  }

  private removeField(i: number): void {
    const newArray = [...this.state.claims];
    newArray.splice(i, 1);
    this.setState({ claims: newArray });
  }

  private async handleSubmitHelper() {
    const adminClaims: IKissTandemAdminClaim[] = this.state.claims.map(function(x) {
      return {
        activities: x.activities.split(',').map((y: string) => parseInt(y, 10)),
        helpees: x.helpees.split(','),
        helpers: x.helpers.split(','),
        minutes: parseInt(x.minutes, 10)
      };
    });

    registerTandemAdminClaim(
      adminClaims,
      this.props.contractAddress,
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

  private async handleSubmit(event: React.FormEvent): Promise<void> {
    // prevent the default behaviour of the form (prevents the browser from issuing a POST request)
    event.preventDefault();
    this.setState({ loading: true }, () => this.handleSubmitHelper());
  }

  private reset() {
    const emptyClaim = { ...this.emptyClaimInput };
    this.setState({ claims: [emptyClaim] as IKissAdminClaimsInput[], calculatingFee: false, fee: 0, loading: false });
  }

  private validAddressInput(helpersValue: string): boolean {
    const helpers = helpersValue.replace(/\s/g, '').split(',');

    return helpers.length > 0 && helpers.every((x) => isValidAddress(x));
  }

  private validActivitiesInput(activitiesValue: string): boolean {
    const activities = activitiesValue.replace(/\s/g, '').split(',');

    return activities.length > 0 && activities.every((x) => !isNaN(parseInt(x)));
  }

  private validateMinutesInput(minuteValue: string): boolean {
    const minute = minuteValue.replace(/\s/g, '');

    return !isNaN(parseInt(minute));
  }

  public render() {
    const validHelpersInput: boolean[] = this.state.claims.map((x) => this.validAddressInput(x.helpers));
    const validHelpeesInput: boolean[] = this.state.claims.map((x) => this.validAddressInput(x.helpees));
    const validActivitiesInput: boolean[] = this.state.claims.map((x) => this.validActivitiesInput(x.activities));
    const validMinutesInput: boolean[] = this.state.claims.map((x) => this.validateMinutesInput(x.minutes));
    const validInputs: boolean =
      validHelpersInput.every((x) => x) &&
      validHelpersInput.every((x) => x) &&
      validActivitiesInput.every((x) => x) &&
      validMinutesInput.every((x) => x);
    const inputs: JSX.Element = (
      <>
        {this.state.claims.map((field, i) => (
          <>
            <Form.Row key={i}>
              <Form.Group as={Col} xs="8" controlId={'helpers-' + i}>
                <Form.Control
                  type="text"
                  className={`font-weight-bold ${!validHelpersInput[i] && 'is-invalid'}`}
                  placeholder="Helpers"
                  value={field.helpers}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.updateField(e, i, 'helpers')}
                  required
                ></Form.Control>
              </Form.Group>
              <Form.Group as={Col} xs="3" controlId={'activities-key-' + i}>
                <Form.Control
                  type="text"
                  className={`font-weight-bold ${!validActivitiesInput[i] && 'is-invalid'}`}
                  placeholder="Activities"
                  value={field.activities}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.updateField(e, i, 'activities')}
                  required
                ></Form.Control>
              </Form.Group>
              <Col xs="1">
                <IconButton onClick={() => this.removeField(i)}>
                  <FaMinusCircle />
                </IconButton>
              </Col>
            </Form.Row>
            <Form.Row key={`${i}-b`}>
              <Form.Group as={Col} xs="8" controlId={'helpees-' + i}>
                <Form.Control
                  type="text"
                  className={`font-weight-bold ${!validHelpeesInput[i] && 'is-invalid'}`}
                  placeholder="Helpees"
                  value={field.helpees}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.updateField(e, i, 'helpees')}
                  required
                ></Form.Control>
              </Form.Group>
              <Form.Group as={Col} xs="3" controlId={'minutes-value-' + i}>
                <Form.Control
                  type="text"
                  className={`font-weight-bold ${!validMinutesInput[i] && 'is-invalid'}`}
                  placeholder="Minutes"
                  value={field.minutes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.updateField(e, i, 'minutes')}
                  required
                ></Form.Control>
              </Form.Group>
              <Col xs="1"></Col>
            </Form.Row>
            <br />
          </>
        ))}
      </>
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
          <Row>
            <Modal.Title>Register tandem as admin</Modal.Title>
          </Row>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={validInputs} id="register-tandem-admin-form">
            {inputs}
          </Form>
          <IconButton onClick={() => this.addField()}>
            <FaPlusCircle />
          </IconButton>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => this.props.hideModal()}>
            Close
          </Button>
          {this.state.loading ? (
            <Loading />
          ) : (
            <Button variant="primary" form="register-tandem-admin-form" type="submit" disabled={!validInputs}>
              Send
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
  }
}
