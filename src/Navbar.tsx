import * as React from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router-dom';

export class MyNavbar extends React.Component<{}, {}> {
  public render() {
    return (
      <Navbar bg="light" variant="light">
        <Navbar.Brand>Tezos TokenGate</Navbar.Brand>
        <Nav className="mr-auto">
          <Nav.Link as={Link} to="/">
            Balances
          </Nav.Link>
          <Nav.Link as={Link} to="/wallet">
            Wallet
          </Nav.Link>
          <Nav.Link as={Link} to="/contract-deployment">
            Contract Deployment
          </Nav.Link>
          <Nav.Link as={Link} to="/secret-key-conversion">
            Key Conversion
          </Nav.Link>
        </Nav>
      </Navbar>
    );
  }
}
