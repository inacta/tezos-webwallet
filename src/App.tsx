/* eslint-disable sort-imports */
import './App.scss';
import React from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
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
        <Container className="py-5 flex-fill flex-grow-1">
          <BrowserRouter>
            <Switch>
              <Route path="/" exact={true} component={Main}></Route>
              <Route path="/token/:address" component={TokenManagement}></Route>
              <Redirect from="*" to="/" strict={true}></Redirect>
            </Switch>
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
