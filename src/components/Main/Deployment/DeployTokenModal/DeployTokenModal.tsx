import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Col from 'react-bootstrap/Col';
import { deployToken, checkAddress } from '../../../../shared/TezosService';
import { EnumDictionary } from '../../../../shared/AbstractTypes';
import { Net, IExtraData } from '../../../../shared/TezosTypes';
import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import Loading from '../../../Loading/Loading';
import DeployTokenModalExtraField from './DeployTokenModalExtraField/DeployTokenModalExtraField';

interface DeployTokenModal {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  showModal: boolean;
  address: string;
  updateModal: React.Dispatch<React.SetStateAction<boolean>>;
  addToken: (network: Net, address: string, token) => void;
}

export default function DeployTokenModal(props) {
  const decimalsMax = 18;
  const decimalsMin = 0;

  const [validated, setValidated] = useState(false);
  const [addressError, updateAddressError] = useState('');
  const [amount, updateAmount] = useState('');
  const [decimals, updateDecimals] = useState('6');
  const [deployingContract, updateDeploymentState] = useState(false);
  const [extraData, updateExtraData]: [IExtraData[], React.Dispatch<React.SetStateAction<IExtraData[]>>] = useState([]);

  const handleSubmit = (event: React.FormEvent) => {
    // get form from event
    const form = event.target as HTMLFormElement;
    // get the input for the tezos address
    const addressInput = form.elements.namedItem('address') as HTMLInputElement;
    // check if address is valid
    const res = checkAddress(addressInput.value);
    // set form validation according to result. Empty string means it passed validation
    updateAddressError(res);
    addressInput.setCustomValidity(res);

    // prevent the default behaviour of the form
    event.preventDefault();
    // check if the rest of the form is valid
    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      // get form values
      const tokenName = (form.elements.namedItem('name') as HTMLInputElement).value;
      const tokenSymbol = (form.elements.namedItem('symbol') as HTMLInputElement).value;
      // set default values for decimals and amount if left empty
      let tokenDecimals = decimals;
      if (tokenDecimals === '') {
        tokenDecimals = decimalsMax.toString();
      }
      let mintingAmount = amount;
      if (mintingAmount === '') {
        mintingAmount = '0';
      }
      // multiply minting amount with the number of decimals
      const mintingAmountBN = new BigNumber(mintingAmount).multipliedBy(
        new BigNumber(10).pow(new BigNumber(tokenDecimals))
      );

      updateDeploymentState(true);
      deployToken(
        tokenName,
        tokenSymbol,
        tokenDecimals,
        addressInput.value,
        mintingAmountBN.toString(),
        extraData,
        props.addToken,
        () => props.updateModal(false)
      );
    }

    setValidated(true);
  };

  const reset = () => {
    setValidated(false);
    updateDeploymentState(false);
    updateDecimals('6');
    updateAmount('');
    updateExtraData([{ key: 'Deployed with', value: 'Tokengate' }]);
  };

  const handleDecimalUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    // replace everything that is not a number
    let formValue = event.currentTarget.value.replace(/[^0-9]+/g, '');
    const parsedNumber = parseInt(formValue);
    // check the specified allowed range for the decimals
    if (parsedNumber > decimalsMax) {
      formValue = decimalsMax.toString();
    } else if (parsedNumber < decimalsMin) {
      formValue = decimalsMin.toString();
    }
    // update the stored value
    updateDecimals(formValue);
    // adjust minting amount according to decimals
    _checkAmount(amount, formValue);
  };

  const checkAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    let formValue = event.currentTarget.value;
    _checkAmount(formValue, decimals);
  };

  // we have to pass the values to the function, as when updating the state, the new value only becomes available after rerendering
  const _checkAmount = (amount: string, _decimals: string) => {
    // if no decimals are provided, assume the maximum number of decimals
    if (_decimals === '') {
      _decimals = decimalsMax.toString();
    }
    const regexString = `^(0|[1-9][0-9]{0,10})(\\.([0-9]{0,${_decimals}}))?`;
    const decimalRegex = new RegExp(regexString);
    const matchedFloat = amount.match(decimalRegex);
    if (amount === '') {
      updateAmount('');
    } else if (matchedFloat !== null) {
      updateAmount(matchedFloat[0]);
    }
  };

  return (
    <Modal
      centered
      show={props.showModal}
      size="lg"
      onSubmit={handleSubmit}
      onHide={() => props.updateModal(false)}
      onEntered={reset}
    >
      <Modal.Header closeButton>
        <Modal.Title>Deploy a new FA2 Token</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate validated={validated} id="token-deployment-form">
          <Form.Row>
            <Form.Group as={Col} md="4" controlId="name">
              <Form.Label>Token name</Form.Label>
              <Form.Control type="text" placeholder="Token name" pattern="^[a-zA-Z0-9 ]{0,}$" required />
              <Form.Control.Feedback type="invalid">
                Please enter a token name that only contains numbers, letters and spaces
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} md="4" controlId="symbol">
              <Form.Label>Token symbol</Form.Label>
              <Form.Control type="text" placeholder="Token symbol" pattern="^[A-Z0-9]{0,6}$" required />
              <Form.Control.Feedback type="invalid">
                The token symbol can be up to 6 uppercase letters and numbers
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} md="4" controlId="decimals">
              <Form.Label>Number of decimals</Form.Label>
              <Form.Control
                type="string"
                placeholder={decimalsMax.toString()}
                value={decimals}
                onChange={handleDecimalUpdate}
              />
              <Form.Control.Feedback type="invalid">Please enter the number of decimals</Form.Control.Feedback>
            </Form.Group>
          </Form.Row>
          {/* <h4>Initial balance</h4> */}
          <Form.Row>
            <Form.Group as={Col} md="6" controlId="address">
              <Form.Label>Tezos address</Form.Label>
              <Form.Control type="text" placeholder="Tezos address" defaultValue={props.address} required />
              <Form.Control.Feedback type="invalid">{addressError}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} md="6" controlId="amount">
              <Form.Label>Amount</Form.Label>
              <Form.Control type="text" placeholder="0" value={amount} onChange={checkAmount} />
              <Form.Control.Feedback type="invalid"></Form.Control.Feedback>
            </Form.Group>
          </Form.Row>
          <DeployTokenModalExtraField extraData={extraData} updateExtraData={updateExtraData} />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => props.updateModal(false)}>
          Close
        </Button>
        {deployingContract ? (
          <Loading />
        ) : (
          <Button variant="primary" form="token-deployment-form" type="submit">
            Deploy Token
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}