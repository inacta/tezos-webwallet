import './WalletInfo.scss';
import { FaMinusCircle, FaPlusCircle } from 'react-icons/fa';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/esm/Container';
import React from 'react';
import Row from 'react-bootstrap/Row';

interface IWalletInfo {
  text: string;
  procons: { text: string; pro: boolean }[];
}

export default function WalletInfo(props: IWalletInfo) {
  return (
    <Row>
      <Col sm="12" md="6">
        <p>{props.text}</p>
      </Col>
      <Col sm="12" md="6">
        <Container fluid>
          {props.procons.map((item, i) => {
            return (
              <Row key={i}>
                <Col>
                  <div className="d-flex">
                    {item.pro ? (
                      <div className="WalletInfo-list-icon">
                        <FaPlusCircle className="text-success" />
                      </div>
                    ) : (
                      <div className="WalletInfo-list-icon">
                        <FaMinusCircle className="text-danger" />
                      </div>
                    )}
                    <span className="ml-2">{item.text}</span>
                  </div>
                </Col>
              </Row>
            );
          })}
        </Container>
      </Col>
    </Row>
  );
}
