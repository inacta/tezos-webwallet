import { IExtraData, ITokenDetails, Net, TokenStandard } from '../../../../shared/TezosTypes';
import React, { useState } from 'react';
import BigNumber from 'bignumber.js';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Col from 'react-bootstrap/Col';
import DeployTokenModalExtraField from './DeployTokenModalExtraField/DeployTokenModalExtraField';
import { EnumDictionary } from '../../../../shared/AbstractTypes';
import { FaInfoCircle } from 'react-icons/fa';
import Form from 'react-bootstrap/Form';
import Loading from '../../../shared/Loading/Loading';
import Modal from 'react-bootstrap/Modal';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { TezosToolkit } from '@taquito/taquito';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Tooltip from 'react-bootstrap/Tooltip';
import { checkAddress } from '../../../../shared/TezosUtil';
import { deployToken } from '../../../../shared/TezosService';

interface IDeployTokenModal {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  showModal: boolean;
  ownAddress: string;
  updateModal: React.Dispatch<React.SetStateAction<boolean>>;
  addToken: (network: Net, address: string, token: ITokenDetails) => void;
}

export default function DeployTokenModal(props: IDeployTokenModal) {
  const decimalsMax = 18;
  const decimalsMin = 0;

  const [tokenStandard, updateTokenStandard] = useState(TokenStandard.FA1_2);
  const [validated, setValidated] = useState(false);
  const [addressError, updateAddressError] = useState('');
  const [amount, updateAmount] = useState('');
  const [decimals, updateDecimals] = useState('6');
  const [deployingContract, updateDeploymentState] = useState(false);
  const [extraData, updateExtraData] = useState([] as IExtraData[]);

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

    const whitelist = form.elements.namedItem('whitelist-switch') as HTMLInputElement;

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

      if (tokenStandard === TokenStandard.FA1_2) {
        tokenDecimals = '0';
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
        tokenStandard,
        whitelist === null ? false : whitelist.checked,
        tokenName,
        tokenSymbol,
        tokenDecimals,
        addressInput.value,
        mintingAmountBN.toFixed(),
        extraData,
        props.addToken,
        () => props.updateModal(false)
      );
    }

    setValidated(true);
  };

  // we have to pass the values to the function, as when updating the state
  // the new value only becomes available after rerendering
  const _checkAmount = (amount: string, _decimals: string, tokenType: TokenStandard) => {
    // if no decimals are provided, assume the maximum number of decimals
    if (_decimals === '') {
      _decimals = decimalsMax.toString();
    }
    let regexString: string;
    if (tokenType === TokenStandard.FA1_2) {
      regexString = `^(0|[1-9][0-9]*)?`;
    } else if (tokenType === TokenStandard.FA2) {
      regexString = `^(0|[1-9][0-9]*)(\\.([0-9]{0,${_decimals}}))?`;
    } else {
      return;
    }
    const decimalRegex = new RegExp(regexString);
    const matchedFloat = amount.match(decimalRegex);
    if (amount === '') {
      updateAmount('');
    } else if (matchedFloat !== null) {
      updateAmount(matchedFloat[0]);
    }
  };

  const switchTokenType = (newType: TokenStandard) => {
    updateTokenStandard(newType);
    _checkAmount(amount, decimals, newType);
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
    _checkAmount(amount, formValue, tokenStandard);
  };

  const checkAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    let formValue = event.currentTarget.value;
    _checkAmount(formValue, decimals, tokenStandard);
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
        <Modal.Title>Deploy a new Token</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5 className="mb-3">
          Token type
          <ButtonGroup toggle className="ml-2">
            <ToggleButton
              type="radio"
              variant="primary"
              name="radio"
              value={TokenStandard.FA1_2}
              checked={tokenStandard === TokenStandard.FA1_2}
              onChange={() => switchTokenType(TokenStandard.FA1_2)}
            >
              FA1.2
            </ToggleButton>
            <ToggleButton
              type="radio"
              variant="primary"
              name="radio"
              value={TokenStandard.FA2}
              checked={tokenStandard === TokenStandard.FA2}
              onChange={() => switchTokenType(TokenStandard.FA2)}
            >
              FA2
            </ToggleButton>
          </ButtonGroup>
        </h5>
        <Form noValidate validated={validated} id="token-deployment-form">
          <Form.Row>
            <Form.Group as={Col} md controlId="name">
              <Form.Label>Token name</Form.Label>
              <Form.Control type="text" placeholder="Token name" pattern="^[a-zA-Z0-9 ]{0,}$" required />
              <Form.Control.Feedback type="invalid">
                Please enter a token name that only contains numbers, letters and spaces
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} md controlId="symbol">
              <Form.Label>Token symbol</Form.Label>
              <Form.Control type="text" placeholder="Token symbol" pattern="^[A-Z0-9]{0,6}$" required />
              <Form.Control.Feedback type="invalid">
                The token symbol can be up to 6 uppercase letters and numbers
              </Form.Control.Feedback>
            </Form.Group>
            {tokenStandard === TokenStandard.FA2 ? (
              <Form.Group as={Col} md controlId="decimals">
                <Form.Label>Number of decimals</Form.Label>
                <Form.Control
                  type="string"
                  placeholder={decimalsMax.toString()}
                  value={decimals}
                  onChange={handleDecimalUpdate}
                />
                <Form.Control.Feedback type="invalid">Please enter the number of decimals</Form.Control.Feedback>
              </Form.Group>
            ) : (
              <></>
            )}
          </Form.Row>
          <h5>Initial balance</h5>
          <Form.Row>
            <Form.Group as={Col} md="6" controlId="address">
              <Form.Label>Tezos address</Form.Label>
              <Form.Control type="text" placeholder="Tezos address" defaultValue={props.ownAddress} required />
              <Form.Control.Feedback type="invalid">{addressError}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group as={Col} md="6" controlId="amount">
              <Form.Label>Amount</Form.Label>
              <Form.Control type="text" placeholder="0" value={amount} onChange={checkAmount} />
              <Form.Control.Feedback type="invalid"></Form.Control.Feedback>
            </Form.Group>
          </Form.Row>
          {tokenStandard === TokenStandard.FA2 ? (
            <DeployTokenModalExtraField extraData={extraData} updateExtraData={updateExtraData} />
          ) : (
            <></>
          )}
          {tokenStandard === TokenStandard.FA1_2 ? (
            <Form.Check
              type="switch"
              size={15}
              id="whitelist-switch"
              label={
                <span>
                  Enable Whitelisting
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id={'tooltip-whitelist-info'}>
                        The address receiving the initial balance will be whitelisted and becomes the whitelist
                        administrator automatically
                      </Tooltip>
                    }
                  >
                    <FaInfoCircle className="text-primary ml-1" />
                  </OverlayTrigger>
                </span>
              }
            />
          ) : (
            <></>
          )}
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
