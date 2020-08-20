/* eslint-disable sort-imports */
import './App.scss';
import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';

import Header from './components/Header/Header';
import Main from './components/Main/Main';
import TokenManagement from './components/TokenManagement/TokenManagement';

import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';

import ReactNotification from 'react-notifications-component';

export class App extends React.Component<{}, {}> {
  public render() {
    return (
      <div className="d-flex flex-column h-100">
        <ReactNotification
          types={[
            {
              htmlClasses: ['permanent-notification'],
              name: 'permanent'
            }
          ]}
        />
        <Header />
        <Container className="container py-5 flex-fill flex-grow-1">
          <BrowserRouter>
            <Route path="/" exact={true} component={Main}></Route>
            <Redirect from="/token" to="/"></Redirect>
            <Route path="/token/:address" component={TokenManagement}></Route>
          </BrowserRouter>
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
