import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';

interface ITokenBalances {
  tokenBalances: Array<{
    name: string;
    amount: string;
    symbol: string;
  }>;
}

export default function TokenBalances(props: ITokenBalances) {
  return (
    <>
      {props.tokenBalances.length === 0 ? (
        <></>
      ) : (
        <Accordion>
          <Card>
            <Accordion.Toggle as={Card.Header} eventKey="0" style={{ cursor: 'pointer' }}>
              Show token balances
            </Accordion.Toggle>
            <Accordion.Collapse eventKey="0">
              <Card.Body className="Balances-token">
                {props.tokenBalances.map((item, i) => {
                  return (
                    <dl className="row" key={i}>
                      <dt className="col-sm-3">{item.name}</dt>
                      <dd className="col-sm-9">
                        {item.amount} {item.symbol}
                      </dd>
                    </dl>
                  );
                })}
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      )}
    </>
  );
}
