import React, { useState } from 'react';
import { isValidSecretKey } from '../../../../../../shared/TezosUtil';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { WalletTypes } from '../../../../../../shared/TezosTypes';
import { InMemorySigner } from '@taquito/signer';

interface IImportPK {
  addSigner: (address: string, signer: WalletTypes, wallet: boolean) => void;
}

export default function ImportPK(props: IImportPK) {
  const [privateKey, updatePrivateKey] = useState('');
  const [keyError, updateKeyError] = useState('');
  const [saveGuard, updateSaveGuard] = useState(false);

  const validateKey = (event) => {
    const formValue = event.currentTarget.value;
    updatePrivateKey(formValue);
    if (isValidSecretKey(formValue)) {
      updateKeyError('');
      updateSaveGuard(true);
    } else {
      updateKeyError('Error: Invalid key');
      updateSaveGuard(false);
    }
  };

  const handleSave = async () => {
    // create signer from private key
    const signer = await InMemorySigner.fromSecretKey(privateKey);
    // get corresponding address
    const address = await signer.publicKeyHash();
    // add the new signer and address to redux
    props.addSigner(address, signer, false);
  };

  return (
    <div>
      <h4>Import a private key</h4>
      <p>You can enter a previously generated private key to import the account.</p>
      <Form>
        <Form.Group>
          <Form.Control placeholder="Enter your private key here" onChange={validateKey} value={privateKey} />
          <Form.Text className="text-danger">{keyError}</Form.Text>
        </Form.Group>
      </Form>
      <hr />
      <Button className="float-right" disabled={!saveGuard} onClick={handleSave}>
        Save
      </Button>
    </div>
  );
}
