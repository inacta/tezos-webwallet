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
import clonedeep from 'lodash.clonedeep';
import { isValidAddress } from '../../shared/TezosUtil';
import { registerTandemAdminClaim } from '../../shared/TezosService';

interface IKissAdminClaimsInput {
  activities: string[];
  helpees: string[];
  helpers: string[];
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
  // Since this is a deeply nested object, only its deepclone copies should be used since
  // fields will be repeated across different tandem claims if that is not the case
  private emptyClaimInput: IKissAdminClaimsInput = {
    activities: [''],
    helpees: [''],
    helpers: [''],
    minutes: ''
  };

  private constructor(props: IKissModalAdminProps) {
    super(props);
    const emptyClaim = clonedeep(this.emptyClaimInput);
    this.state = {
      claims: [emptyClaim],
      calculatingFee: false,
      fee: 0,
      loading: false
    };
  }

  // Used since several input fields are sets and it does not accept repeated values
  private hasNonEmptyDuplicates(xs: string[]): boolean {
    return xs.some((item, index) => item !== '' && xs.indexOf(item) !== index);
  }

  // The spread operator creates copies of the arrays and objects
  // so multiple entries in the claims array do not reference the same object instance.
  private updateField(
    event: React.ChangeEvent<HTMLInputElement>,
    tandemIndex: number,
    otherIndex: number,
    type: 'helpers' | 'helpees' | 'activities'
  ) {
    const newValue = event.currentTarget.value;
    const newArray = [...this.state.claims];
    newArray[tandemIndex][type][otherIndex] = newValue;
    this.setState({ claims: newArray });
  }

  private updateMinutes(event: React.ChangeEvent<HTMLInputElement>, tandemIndex: number) {
    const newValue = event.currentTarget.value;
    const newArray = [...this.state.claims];
    newArray[tandemIndex]['minutes'] = newValue;
    this.setState({ claims: newArray });
  }

  private addElementToTandemField(
    event: React.MouseEvent<HTMLElement>,
    tandemIndex: number,
    type: 'helpers' | 'helpees' | 'activities'
  ): void {
    event.preventDefault();
    const claims = [...this.state.claims];
    const newArray = [...this.state.claims[tandemIndex][type]];
    const newHelper = '';
    newArray.push(newHelper);
    claims[tandemIndex][type] = newArray;
    this.setState({ claims });
  }

  private removeElementFromTandemField(
    event: React.MouseEvent<HTMLElement>,
    tandemIndex: number,
    elementIndex: number,
    type: 'helpers' | 'helpees' | 'activities'
  ): void {
    event.preventDefault();
    const claims = [...this.state.claims];
    const newArray = [...this.state.claims[tandemIndex][type]];
    newArray.splice(elementIndex, 1);
    claims[tandemIndex][type] = newArray;
    this.setState({ claims });
  }

  private addTandemClaim(): void {
    const newArray = [...this.state.claims];
    const newClaim = clonedeep(this.emptyClaimInput);
    newArray.push(newClaim);
    this.setState({ claims: newArray });
  }

  private removeTandemClaim(e: React.MouseEvent<HTMLElement>, i: number): void {
    e.preventDefault();
    const newArray = [...this.state.claims];
    newArray.splice(i, 1);
    this.setState({ claims: newArray });
  }

  private async handleSubmitHelper() {
    const adminClaims: IKissTandemAdminClaim[] = this.state.claims.map(function(x) {
      return {
        activities: x.activities.map((y: string) => parseInt(y, 10)),
        helpees: x.helpees,
        helpers: x.helpers,
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
    const emptyClaim = clonedeep(this.emptyClaimInput);
    this.setState({ claims: [emptyClaim] as IKissAdminClaimsInput[], calculatingFee: false, fee: 0, loading: false });
  }

  private validAddressInput(input: string): boolean {
    if (!input) return false;

    return isValidAddress(input);
  }

  private validActivitiesInput(activitiesValue: string): boolean {
    return !isNaN(parseInt(activitiesValue));
  }

  private validateMinutesInput(minuteValue: string): boolean {
    const minute = minuteValue.replace(/\s/g, '');

    return !isNaN(parseInt(minute));
  }

  public render() {
    const validHelpersInput: boolean[][] = this.state.claims.map((x) =>
      x.helpers.map((y) => this.validAddressInput(y))
    );
    const validHelpeesInput: boolean[][] = this.state.claims.map((x) =>
      x.helpees.map((y) => this.validAddressInput(y))
    );
    const validActivitiesInput: boolean[][] = this.state.claims.map((x) =>
      x.activities.map((y) => this.validActivitiesInput(y))
    );
    const validMinutesInput: boolean[] = this.state.claims.map((x) => this.validateMinutesInput(x.minutes));

    // Duplicates in the inputes are disallowed since sets are used in the smart contract and they
    // do not allow repeated values
    const hasHelpeeDuplicates: boolean[] = this.state.claims.map((x) => this.hasNonEmptyDuplicates(x.helpees));
    const hasHelperDuplicates: boolean[] = this.state.claims.map((x) => this.hasNonEmptyDuplicates(x.helpers));
    const hasActivityDuplicates: boolean[] = this.state.claims.map((x) => this.hasNonEmptyDuplicates(x.activities));
    const validInputs: boolean =
      validHelpersInput.every((x) => x.every((y) => y)) &&
      validHelpeesInput.every((x) => x.every((y) => y)) &&
      validActivitiesInput.every((x) => x.every((y) => y)) &&
      validMinutesInput.every((x) => x) &&
      hasHelpeeDuplicates.every((x) => !x) &&
      hasHelperDuplicates.every((x) => !x) &&
      hasActivityDuplicates.every((x) => !x);
    const inputs: JSX.Element = (
      <>
        {this.state.claims.map((field, i) => (
          <>
            <Form.Row key={i}>
              <Form.Group as={Col} xs="8" controlId={'helpers-' + i}>
                Helpers
                {field.helpers.map((helper, j) => (
                  <Form.Control
                    key={j}
                    type="text"
                    className={`font-weight-bold ${!validHelpersInput[i][j] && 'is-invalid'}`}
                    placeholder="Helper"
                    value={helper}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.updateField(e, i, j, 'helpers')}
                    required
                  ></Form.Control>
                ))}
                {hasHelperDuplicates[i] && <small className="text-danger">Duplicates detected</small>}
                <IconButton
                  onClick={(e: React.MouseEvent<HTMLElement>) => this.addElementToTandemField(e, i, 'helpers')}
                >
                  <FaPlusCircle color="blue" />
                </IconButton>
                {field.helpers.length > 1 ? (
                  <IconButton
                    onClick={(e: React.MouseEvent<HTMLElement>) =>
                      this.removeElementFromTandemField(e, i, field.helpers.length - 1, 'helpers')
                    }
                  >
                    <FaMinusCircle color="red" />
                  </IconButton>
                ) : (
                  undefined
                )}
              </Form.Group>
              <Form.Group as={Col} xs="3" controlId={'activities-key-' + i}>
                Activities
                {field.activities.map((activity, j) => (
                  <Form.Control
                    key={j}
                    type="text"
                    className={`font-weight-bold ${!validActivitiesInput[i][j] && 'is-invalid'}`}
                    placeholder="Activity"
                    value={activity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.updateField(e, i, j, 'activities')}
                    required
                  ></Form.Control>
                ))}
                {hasActivityDuplicates[i] && <small className="text-danger">Duplicates detected</small>}
                <IconButton
                  onClick={(e: React.MouseEvent<HTMLElement>) => this.addElementToTandemField(e, i, 'activities')}
                >
                  <FaPlusCircle color="blue" />
                </IconButton>
                {field.activities.length > 1 ? (
                  <IconButton
                    onClick={(e: React.MouseEvent<HTMLElement>) =>
                      this.removeElementFromTandemField(e, i, field.activities.length - 1, 'activities')
                    }
                  >
                    <FaMinusCircle color="red" />
                  </IconButton>
                ) : (
                  undefined
                )}
              </Form.Group>
              <Col xs="1">
                <IconButton onClick={(e: React.MouseEvent<HTMLElement>) => this.removeTandemClaim(e, i)}>
                  <FaMinusCircle />
                </IconButton>
              </Col>
            </Form.Row>
            <Form.Row key={`${i}-b`}>
              <Form.Group as={Col} xs="8" controlId={'helpees-' + i}>
                Helpees
                {field.helpees.map((helpee, j) => (
                  <Form.Control
                    key={j}
                    type="text"
                    className={`font-weight-bold ${!validHelpeesInput[i][j] && 'is-invalid'}`}
                    placeholder="Helpee"
                    value={helpee}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.updateField(e, i, j, 'helpees')}
                    required
                  ></Form.Control>
                ))}
                {hasHelpeeDuplicates[i] && <small className="text-danger">Duplicates detected</small>}
                <IconButton
                  onClick={(e: React.MouseEvent<HTMLElement>) => this.addElementToTandemField(e, i, 'helpees')}
                >
                  <FaPlusCircle color="blue" />
                </IconButton>
                {field.helpees.length > 1 ? (
                  <IconButton
                    onClick={(e: React.MouseEvent<HTMLElement>) =>
                      this.removeElementFromTandemField(e, i, field.helpees.length - 1, 'helpees')
                    }
                  >
                    <FaMinusCircle color="red" />
                  </IconButton>
                ) : (
                  undefined
                )}
              </Form.Group>
              <Form.Group as={Col} xs="3" controlId={'minutes-value-' + i}>
                Minutes
                <Form.Control
                  type="text"
                  className={`font-weight-bold ${!validMinutesInput[i] && 'is-invalid'}`}
                  placeholder="Minutes"
                  value={field.minutes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.updateMinutes(e, i)}
                  required
                ></Form.Control>
              </Form.Group>
              <Col xs="1"></Col>
            </Form.Row>
            <hr />
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
          <IconButton onClick={() => this.addTandemClaim()}>
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
