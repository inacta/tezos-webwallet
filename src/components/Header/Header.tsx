import './Header.scss';
import * as React from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router-dom';

export class Header extends React.Component<{}, {}> {
  public render() {
    return (
      <Navbar bg="dark" variant="dark" className="justify-content-between">
        <Navbar.Brand>
          <img className="Header-logo" src="/assets/img/logo.png" alt="TokenGate Tezos" />
        </Navbar.Brand>
        <Nav>
          <Nav.Link as={Link} to="/balance">
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
