import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import { transferTezos, checkAddress, estimateCosts } from '../../../../shared/TezosService';
import BigNumber from 'bignumber.js';
import Loading from '../../../Loading/Loading';

interface IFA1_2TransferModal {
  show: boolean;
  balance: string;
  symbol: string;
  hideModal: () => void;
  balanceCallback: () => void;
}

export default function FA1_2TransferModal(props: IFA1_2TransferModal) {
  const [validated, setValidated] = useState(false);
  const [address, updateAddress] = useState('');
  const [amount, updateAmount] = useState('');
  const [addressError, updateAddressError] = useState('');
  const [amountError, updateAmountError] = useState('');
  const [fee, updateFee] = useState('');
  const [calculatingFee, updateCF] = useState(false);
  const [loading, updateLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    // get form from event
    const form = event.target as HTMLFormElement;
    // get the input for the tezos address
    const addressInput = form.elements.namedItem('recipient') as HTMLInputElement;
    // set form validation according to result. Empty string means it passed validation
    addressInput.setCustomValidity(addressError);

    // check if balance is sufficient to transfer
    const amountInput = form.elements.namedItem('amount') as HTMLInputElement;
    amountInput.setCustomValidity(amountError);

    // prevent the default behaviour of the form
    event.preventDefault();
    // check if the rest of the form is valid
    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      transferTezos(addressInput.value, parseFloat(amount), props.hideModal, props.balanceCallback);
      updateLoading(true);
    }

    setValidated(true);
  };

  const checkAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    let formValue = event.currentTarget.value;

    if (formValue === '') {
      updateAmount('');
      updateAmountError('');
      return;
    }

    const regexString = `^(0|[1-9][0-9]{0,18})?`;
    const decimalRegex = new RegExp(regexString);
    const matchedFloat = formValue.match(decimalRegex);
    if (matchedFloat !== null) {
      updateAmount(matchedFloat[0]);
      estimateFee(address, matchedFloat[0]);
    }
  };

  const _updateAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    // get the input for the tezos address
    const formValue = event.currentTarget.value;
    // check if address is valid
    const err = checkAddress(formValue);
    // set form validation according to result. Empty string means it passed validation
    updateAddress(formValue);
    if (formValue === '') {
      updateAddressError('');
      return;
    }
    updateAddressError(err);

    if (err === '') {
      estimateFee(formValue, amount);
    }
  };

  const estimateFee = async (recipient: string, amount: string) => {
    if (checkAddress(recipient) === '' && amount !== '') {
      let _amountError = '';
      updateAmountError(_amountError);
      updateCF(true);
      try {
        const gasEstimations = await estimateCosts(recipient, parseFloat(amount));
        updateFee(new BigNumber(gasEstimations.suggestedFeeMutez).dividedBy(new BigNumber(10).pow(6)).toString());
      } catch (e) {
        if (e.id === 'proto.006-PsCARTHA.contract.balance_too_low') {
          _amountError = 'Insufficient balance';
        } else if (e.id === 'proto.006-PsCARTHA.contract.empty_transaction') {
          _amountError = 'You cannot send an empty transaction';
        }
      } finally {
        updateAmountError(_amountError);
        updateCF(false);
      }
    }
  };

  const reset = () => {
    setValidated(false);
    updateLoading(false);
    updateAddress('');
    updateAmount('');
    updateAddressError('');
    updateAmountError('');
    updateFee('');
    updateCF(false);
  };
  return (
    <Modal show={props.show} centered size="lg" onHide={props.hideModal} onSubmit={handleSubmit} onEntered={reset}>
      <Modal.Header closeButton>
        <Modal.Title>Transfer Tezos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate validated={validated} id="transfer-form">
          <Form.Row>
            <Form.Group as={Col} md="8" controlId="recipient">
              <Form.Label>Recipient</Form.Label>
              <Form.Control
                type="text"
                placeholder="Tezos address"
                value={address}
                onChange={_updateAddress}
                className={addressError !== '' ? 'is-invalid' : ''}
                required
              ></Form.Control>
              <Form.Control.Feedback type="invalid">{addressError}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} md="4" controlId="amount">
              <Form.Label>Amount</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Amount"
                  value={amount}
                  onChange={checkAmount}
                  required
                  className={amountError !== '' ? 'is-invalid' : ''}
                ></Form.Control>
                <InputGroup.Append>
                  <InputGroup.Text>{props.symbol}</InputGroup.Text>
                </InputGroup.Append>
                <Form.Control.Feedback type="invalid">{amountError}</Form.Control.Feedback>
              </InputGroup>
              <Form.Text className="text-muted">
                {calculatingFee
                  ? `Calculating fee...`
                  : fee !== '' && amountError === '' && addressError === ''
                  ? `Fee for this transaction : ${fee} ꜩ`
                  : ''}
              </Form.Text>
            </Form.Group>
          </Form.Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.hideModal}>
          Close
        </Button>
        {loading ? (
          <Loading />
        ) : (
          <Button variant="primary" form="transfer-form" type="submit" disabled={calculatingFee}>
            Send
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
