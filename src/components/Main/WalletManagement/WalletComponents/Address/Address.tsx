import React, { useState } from 'react';
import { isContractAddress } from '../../../../../shared/TezosUtil';
import { ValidationResult, validateAddress } from '@taquito/utils';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

interface IAddress {
  changeAddress: (address: string) => void;
}

export default function Address(props: IAddress) {
  const [addressError, updateAddressError] = useState('');
  const [address, updateAddress] = useState('');

  const checkAddress = (event) => {
    // get form value
    const formValue = event.currentTarget.value;
    // update form field
    updateAddress(formValue);

    // initiate address validation check
    const res = validateAddress(formValue);
    if (res === ValidationResult.NO_PREFIX_MATCHED) {
      updateAddressError('Invalid Address: no prefix matched');
    } else if (res === ValidationResult.INVALID_CHECKSUM) {
      updateAddressError('Invalid checksum');
    } else if (res === ValidationResult.INVALID_LENGTH) {
      updateAddressError('Invalid length');
    } else if (res === ValidationResult.VALID) {
      if (isContractAddress(formValue)) {
        updateAddressError('Contract address is not allowed');
      } else {
        // if address is valid, update redux storage
        updateAddressError('');
      }
    }
  };

  const handleSave = () => {
    if (addressError !== '' && address !== '') {
      return;
    }
    props.changeAddress(address);
  };

  return (
    <div>
      <hr />
      <h3>Address (view only)</h3>
      <p>Enter your Tezos address to view your tez or Token balances and more!</p>
      <Form>
        <Form.Group>
          <Form.Control placeholder="Enter your address" onChange={checkAddress} value={address} />
          <Form.Text className="text-danger">{addressError}</Form.Text>
        </Form.Group>
      </Form>
      <hr />
      <Button className="float-right" disabled={addressError !== '' || address === ''} onClick={handleSave}>
        Save
      </Button>
    </div>
  );
}
