import './Header.scss';
import * as React from 'react';
import Navbar from 'react-bootstrap/Navbar';

export class Header extends React.Component<{}, {}> {
  public render() {
    return (
      <Navbar bg="dark" variant="dark" className="justify-content-between">
        <Navbar.Brand>
          <img className="Header-logo" src="/assets/img/logo.png" alt="TokenGate Tezos" />
        </Navbar.Brand>
      </Navbar>
    );
  }
}
