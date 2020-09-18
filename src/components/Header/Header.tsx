import './Header.scss';
import * as React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import { FiSettings } from 'react-icons/fi';
import { RiSettings4Line } from 'react-icons/ri';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <Navbar bg="dark" variant="dark" className="justify-content-between">
      <Navbar.Brand>
        <img className="Header-logo" src="/assets/img/logo.png" alt="TokenGate Tezos" />
      </Navbar.Brand>
      <Link to="/settings">
        <h2 className="text-light">
          <FiSettings strokeWidth="1.5" />
        </h2>
      </Link>
    </Navbar>
  );
}
