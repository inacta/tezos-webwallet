import { FaMinusCircle, FaPlusCircle } from 'react-icons/fa';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import { IExtraData } from '../../../../../shared/TezosTypes';
import IconButton from '../../../../shared/IconButton/IconButton';
import React from 'react';

interface IDeployTokenModalExtraField {
  extraData: IExtraData[];
  updateExtraData: React.Dispatch<React.SetStateAction<IExtraData[]>>;
}
export default function DeployTokenModalExtraField(props: IDeployTokenModalExtraField) {
  const updateField = (event: React.ChangeEvent<HTMLInputElement>, i: number, type: 'key' | 'value') => {
    const newValue = event.currentTarget.value;
    const newArray = [...props.extraData];
    newArray[i][type] = newValue;
    props.updateExtraData(newArray);
  };

  const removeField = (i: number) => {
    const newArray = [...props.extraData];
    newArray.splice(i, 1);
    props.updateExtraData(newArray);
  };

  const addField = () => {
    const newArray = [...props.extraData];
    newArray.push({ key: '', value: '' });
    props.updateExtraData(newArray);
  };

  return (
    <Accordion>
      <Card>
        <Accordion.Toggle as={Card.Header} eventKey="0" style={{ cursor: 'pointer' }}>
          Add additional information
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="0">
          <Card.Body>
            {props.extraData.map((field, i) => {
              return (
                <Form.Row key={i}>
                  <Form.Group as={Col} md xs="12" controlId={'extras-key-' + i}>
                    <Form.Control
                      type="text"
                      className="font-weight-bold"
                      placeholder="Key"
                      value={field.key}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(e, i, 'key')}
                      required
                    ></Form.Control>
                  </Form.Group>
                  <Form.Group as={Col} md xs="10" controlId={'extras-value-' + i}>
                    <Form.Control
                      type="text"
                      placeholder="Value"
                      value={field.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(e, i, 'value')}
                      required
                    ></Form.Control>
                  </Form.Group>
                  <Col md="auto" xs="2">
                    <IconButton onClick={() => removeField(i)}>
                      <FaMinusCircle />
                    </IconButton>
                  </Col>
                </Form.Row>
              );
            })}
            <IconButton onClick={addField}>
              <FaPlusCircle />
            </IconButton>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
}
