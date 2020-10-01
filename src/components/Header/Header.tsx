import './Header.scss';
import { FiSettings } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import React from 'react';

export default function Header() {
  return (
    <Navbar bg="dark" variant="dark" className="Header-bar justify-content-between">
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
