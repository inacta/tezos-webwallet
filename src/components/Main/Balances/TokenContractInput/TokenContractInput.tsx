import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import FormControl from 'react-bootstrap/FormControl';
import FormText from 'react-bootstrap/FormText';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import { isContractAddress } from '../../../../shared/TezosUtil';

interface ITokenContractInput {
  handleModal: React.Dispatch<
    React.SetStateAction<{
      show: boolean;
      address: string;
    }>
  >;
}

export default function TokenContractInput(props: ITokenContractInput) {
  const [tokenContract, updateContract] = useState({
    address: '',
    error: ''
  });

  const checkContractAddress = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        <h3 className="mt-5">Add a custom Token</h3>
        <p>You can add a custom token implemented under the FA1.2 or FA2 standard here.</p>
        <InputGroup>
          <FormControl
            placeholder="Token Contract Address"
            onChange={checkContractAddress}
            value={tokenContract.address}
          />
          <InputGroup.Append>
            <Button
              variant="outline-primary"
              onClick={() => props.handleModal({ show: true, address: tokenContract.address })}
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
