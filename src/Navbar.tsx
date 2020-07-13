import * as React from 'react';
import { Nav, Navbar } from 'react-bootstrap';

export class MyNavbar extends React.Component<{}, {}> {
  public render() {
    return (
      <>
        <Navbar bg="light" variant="light">
          <Navbar.Brand href="#home">inacta Tezos Gateway</Navbar.Brand>
          <Nav className="mr-auto">
            <Nav.Link href="/">Balances</Nav.Link>
            <Nav.Link href="/wallet">Wallet</Nav.Link>
            <Nav.Link href="/contract-deployment">Contract Deployment</Nav.Link>
            <Nav.Link href="/secret-key-conversion">Key Conversion</Nav.Link>
          </Nav>
        </Navbar>
      </>
    );
  }
}
