import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { Net } from '../../../../shared/TezosTypes';
import { EnumDictionary } from '../../../../shared/AbstractTypes';
import { TezosToolkit } from '@taquito/taquito';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Loading from '../../../Loading/Loading';
import { handleContractDeployment } from '../../../../shared/TezosService';
import { addNotification } from '../../../../shared/NotificationService';

interface IDeploySmartContractModal {
  network: Net;
  net2client: EnumDictionary<Net, TezosToolkit>;
  showModal: boolean;
  updateModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DeploySmartContractModal(props: IDeploySmartContractModal) {
  const [deployingContract, updateDeploymentState] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    // get form from event
    const form = event.target as HTMLFormElement;
    // get form values
    const michelson = (form.elements.namedItem('michelson') as HTMLInputElement).value;
    const storage = (form.elements.namedItem('storage') as HTMLInputElement).value;

    event.preventDefault();

    updateDeploymentState(true);
    try {
      await handleContractDeployment(michelson, storage, () => props.updateModal(false));
    } catch (e) {
      console.error(e);
      addNotification('danger', 'Invalid data provided');
    }
    updateDeploymentState(false);
  };

  return (
    <Modal centered show={props.showModal} size="lg" onSubmit={handleSubmit} onHide={() => props.updateModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Deploy a new smart contract</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate id="sc-deployment-form">
          <Form.Group controlId="michelson">
            <Form.Label>Michelson code as JSON</Form.Label>
            <Form.Control as="textarea" rows={5} />
          </Form.Group>
          <Form.Group controlId="storage">
            <Form.Label>Initial storage as JSON</Form.Label>
            <Form.Control as="textarea" rows={3} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => props.updateModal(false)}>
          Close
        </Button>
        {deployingContract ? (
          <Loading />
        ) : (
          <Button variant="primary" form="sc-deployment-form" type="submit">
            Deploy smart contract
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
