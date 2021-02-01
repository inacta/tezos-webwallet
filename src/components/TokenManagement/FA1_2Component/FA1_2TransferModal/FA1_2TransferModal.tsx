import React, { useState } from 'react';
import { checkAddress, isWallet } from '../../../../shared/TezosUtil';
import { estimateTokenTransferCosts, transferToken } from '../../../../shared/TezosService';
import BigNumber from 'bignumber.js';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import { Estimate } from '@taquito/taquito/dist/types/contract/estimate';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Loading from '../../../shared/Loading/Loading';
import Modal from 'react-bootstrap/Modal';
import { TokenStandard } from '../../../../shared/TezosTypes';
import { addNotification } from '../../../../shared/NotificationService';

interface IFA1_2TransferModal {
  show: boolean;
  tokenBalance: string;
  symbol: string;
  contractAddress: string;
  hideModal: () => void;
  tokenBalanceCallback: () => void;
}

let nonce = 0;

export default function FA1_2TransferModal(props: IFA1_2TransferModal) {
  const [validated, setValidated] = useState(false);
  const [address, updateAddress] = useState('');
  const [amount, updateAmount] = useState('');
  const [addressError, updateAddressError] = useState('');
  const [amountError, updateAmountError] = useState('');
  const [fee, updateFee] = useState('');
  const [calculatingFee, updateCF] = useState(false);
  const [loading, updateLoading] = useState(false);

  // nonce for fee estimation
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
      updateLoading(true);
      transferToken(
        TokenStandard.FA1_2,
        props.contractAddress,
        addressInput.value,
        amount,
        props.hideModal,
        props.tokenBalanceCallback
      ).catch((e) => {
        updateLoading(false);
        if (e.message === 'rejected') {
          addNotification('danger', 'The user rejected the transaction');
        } else if (e.message === 'RECEIVER_NOT_WHITELISTED') {
          addNotification('danger', 'The recipient is not whitelisted');
        } else {
          console.error(JSON.stringify(e));
          addNotification('danger', 'An error occurred');
        }
      });

      updateLoading(true);
    }

    setValidated(true);
  };

  const estimateFee = async (recipient: string, amount: string) => {
    if (isWallet()) {
      return;
    }
    if (checkAddress(recipient) === '' && amount !== '') {
      // keep track of fee estimation requests
      nonce += 1;
      const nonceTmp = nonce;
      let _amountError = '';
      if (new BigNumber(amount).gt(new BigNumber(props.tokenBalance))) {
        updateAmountError('Insufficient token balance');
        updateCF(false);
        return;
      }
      updateAmountError(_amountError);
      updateCF(true);

      const gasFetchError = 'Failed to get gas estimate';
      try {
        const gasEstimations: Estimate | undefined = await estimateTokenTransferCosts(
          TokenStandard.FA1_2,
          props.contractAddress,
          recipient,
          amount
        );
        if (!gasEstimations) {
          throw new Error(gasFetchError);
        }

        const res = new BigNumber(gasEstimations.suggestedFeeMutez).dividedBy(new BigNumber(10).pow(6)).toString();
        // only update the fee if this is the latest request
        if (nonce === nonceTmp) {
          updateFee(res);
        } else {
          return;
        }
      } catch (e) {
        if (e.message === 'Public key cannot be exposed') {
          _amountError = 'The public key has not been exposed yet';
        } else if (e.id === 'proto.006-PsCARTHA.contract.balance_too_low') {
          _amountError = 'Insufficient balance';
        } else if (e.id === 'proto.006-PsCARTHA.contract.empty_transaction') {
          _amountError = 'You cannot send an empty transaction';
        } else if (e.message === 'RECEIVER_NOT_WHITELISTED') {
          _amountError = 'The recipient is not whitelisted';
        } else if (e.message === gasFetchError) {
          _amountError = gasFetchError;
        } else {
          console.error(e);
        }
      } finally {
        // only update the fee if this is the latest request
        if (nonce === nonceTmp) {
          updateAmountError(_amountError);
          updateCF(false);
        }
      }
    }
  };

  const checkAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    let formValue = event.currentTarget.value;

    if (formValue === '') {
      updateAmount('');
      updateAmountError('');
      return;
    }

    const regexString = `^(0|[1-9][0-9]*)?`;
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
        <Modal.Title>Transfer Tokens</Modal.Title>
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
