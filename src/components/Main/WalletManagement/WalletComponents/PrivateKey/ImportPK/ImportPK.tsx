import { InMemorySigner, importKey } from '@taquito/signer';
import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { TezosToolkit } from '@taquito/taquito';
import { WalletTypes } from '../../../../../../shared/TezosTypes';
import { isValidSecretKey } from '../../../../../../shared/TezosUtil';

// Taken from faucet.tzalpha.net
interface IExpectedInputFormat {
  amount: string;
  email: string;
  mnemonic: string[];
  secret: string;
  pkh: string;
  password: string;
}

interface IImportPK {
  addSigner: (address: string, signer: WalletTypes, wallet: boolean) => void;
}

export default function ImportPK(props: IImportPK) {
  // "plain" secret keys are the ones that start with 'edsk'
  // JSON secret key is the format used by e.g. https://faucet.tzalpha.net/
  const [privateKeyPlain, updatePrivateKeyPlain] = useState('');
  const [privateKeyJson, updatePrivateKeyJson] = useState('');
  const [keyErrorPlain, updateKeyErrorPlain] = useState('');
  const [keyErrorJson, updateKeyErrorJson] = useState('');
  const [saveGuardPlain, updateSaveGuardPlain] = useState(false);
  const [saveGuardJson, updateSaveGuardJson] = useState(false);

  const validateKeyPlain = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formValue = event.currentTarget.value;
    updatePrivateKeyPlain(formValue);
    if (isValidSecretKey(formValue)) {
      updateKeyErrorPlain('');
      updateSaveGuardPlain(true);
    } else {
      updateKeyErrorPlain('Error: Invalid key');
      updateSaveGuardPlain(false);
    }
  };

  const getParsedJson = (input: string): IExpectedInputFormat | undefined => {
    let parsed: IExpectedInputFormat;
    try {
      // Parsing success only means that input is valid JSON, not that
      // it contains any of the fields in IExpectedInputFormat as this
      // type only exists at compile time. So we have to manually check
      // that the required fields are not undefined.
      // mnemonic length from https://faucet.tzalpha.net/ is 15.
      parsed = JSON.parse(input);
      if (parsed.mnemonic !== undefined && parsed.mnemonic.length !== undefined && parsed.mnemonic.length >= 12) {
        return parsed;
      } else {
        return undefined;
      }
    } catch (error) {
      return undefined;
    }
  };

  const validateKeyJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formValue = event.currentTarget.value;
    updatePrivateKeyJson(formValue);
    if (getParsedJson(formValue)) {
      updateKeyErrorJson('');
      updateSaveGuardJson(true);
    } else {
      updateKeyErrorJson('Error: Invalid key');
      updateSaveGuardJson(false);
    }
  };

  const handleSavePlain = async () => {
    // create signer from private key
    const signer = await InMemorySigner.fromSecretKey(privateKeyPlain);
    // get corresponding address
    const address = await signer.publicKeyHash();
    // add the new signer and address to redux
    props.addSigner(address, signer, false);
  };

  const handleSaveJson = async () => {
    const parsed = getParsedJson(privateKeyJson);
    if (parsed === undefined) {
      return;
    }

    const tezos = new TezosToolkit();
    await importKey(tezos, parsed.email, parsed.password, parsed.mnemonic.join(' '), parsed.secret);
    const sk: string | undefined = await tezos.signer.secretKey();
    if (sk === undefined) {
      console.log('Unable to load secret key');
      return;
    }

    // create signer from private key
    const signer = await InMemorySigner.fromSecretKey(sk);
    // get corresponding address
    const address = await signer.publicKeyHash();
    // add the new signer and address to redux
    props.addSigner(address, signer, false);
  };

  return (
    <>
      <div>
        <h4>Import a private key</h4>
        <p>You can enter a previously generated private key to import the account.</p>
        <Form>
          <Form.Group>
            <Form.Control
              placeholder="Enter your private key here"
              onChange={validateKeyPlain}
              value={privateKeyPlain}
            />
            <Form.Text className="text-danger">{keyErrorPlain}</Form.Text>
          </Form.Group>
        </Form>
        <Button
          className="float-right"
          disabled={!saveGuardPlain}
          onChange={validateKeyPlain}
          onClick={handleSavePlain}
        >
          Save
        </Button>
        <br />
        <br />
      </div>
      <div>
        <Form>
          <Form.Group>
            <label htmlFor="secret-key-json-input">JSON input for secret key</label>
            <Form.Control
              as="textarea"
              cols={50}
              id="secret-key-json-input"
              onChange={validateKeyJson}
              placeholder="Enter your JSON-formatted private key here"
              rows={25}
              value={privateKeyJson}
            />
            <Form.Text className="text-danger">{keyErrorJson}</Form.Text>
          </Form.Group>
          <Button className="float-right" disabled={!saveGuardJson} onChange={validateKeyJson} onClick={handleSaveJson}>
            Save
          </Button>
        </Form>
      </div>
    </>
  );
}
