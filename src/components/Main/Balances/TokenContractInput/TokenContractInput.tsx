import React, { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import FormText from 'react-bootstrap/FormText';
import { isContractAddress } from '../../../../shared/TezosService';

interface ITokenContractInput {
  handleModal: React.Dispatch<
    React.SetStateAction<{
      show: boolean;
      new: boolean;
      address: string;
    }>
  >;
}

export default function TokenContractInput(props: ITokenContractInput) {
  const [tokenContract, updateContract] = useState({
    address: '',
    error: ''
  });

  const checkContractAddress = async (event) => {
    // get form value
    const formValue = event.currentTarget.value;

    if (formValue === '') {
      updateContract({
        address: '',
        error: ''
      });
      return;
    }
    if (!isContractAddress(formValue)) {
      updateContract({
        address: formValue,
        error: 'This is not a valid contract address'
      });
    } else {
      updateContract({
        address: formValue,
        error: ''
      });
    }
  };

  return (
    <Row>
      <Col>
        <h3 className="mt-4">Add a custom Token</h3>
        <p>You can add a custom token implemented under the FA2 standard here.</p>
        <InputGroup>
          <FormControl
            placeholder="Token Contract Address"
            onChange={checkContractAddress}
            value={tokenContract.address}
          />
          <InputGroup.Append>
            <Button
              variant="outline-primary"
              onClick={() => props.handleModal({ show: true, new: true, address: tokenContract.address })}
              disabled={tokenContract.error !== '' || tokenContract.address === ''}
            >
              Add Token
            </Button>
          </InputGroup.Append>
        </InputGroup>
        <FormText className="text-danger">{tokenContract.error}</FormText>
      </Col>
    </Row>
  );
}
