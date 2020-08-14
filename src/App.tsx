/* eslint-disable sort-imports */
import './App.scss';
import 'react-notifications-component/dist/theme.css';
import React from 'react';
import { Route } from 'react-router-dom';
import { Header } from './components/Header/Header';

import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Main from './components/Main/Main';

import ReactNotification from 'react-notifications-component';

export class App extends React.Component<{}, {}> {
  public render() {
    return (
      <div className="d-flex flex-column h-100">
        <ReactNotification />
        <Header />
        <Container className="container py-5 flex-fill flex-grow-1">
          <Route path="/" component={Main}></Route>
        </Container>
        {/* Footer */}
        <Navbar bg="light" sticky="bottom">
          &copy; {new Date().getFullYear()} inacta AG
        </Navbar>
      </div>
    );
  }
}

export default App;
