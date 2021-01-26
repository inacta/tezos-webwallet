import './App.scss';
import { Redirect, Route, Switch } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Header from './components/Header/Header';
import Main from './components/Main/Main';
import Navbar from 'react-bootstrap/Navbar';
import React from 'react';
import ReactNotification from 'react-notifications-component';
import Settings from './components/Settings/Settings';
import TokenManagement from './components/TokenManagement/TokenManagement';
import { AiFillGithub } from 'react-icons/ai';

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
        <BrowserRouter>
          <Header />
          <Container className="py-5 flex-fill flex-grow-1">
            <Switch>
              <Route path="/" exact={true} component={Main}></Route>
              <Route path="/settings" exact={true} component={Settings}></Route>
              <Route path="/token/:address" component={TokenManagement}></Route>
              <Redirect from="*" to="/" strict={true}></Redirect>
            </Switch>
          </Container>
          {/* Footer */}
          <Navbar
            bg="light"
            sticky="bottom"
            className="d-flex justify-content-between align-items-center"
            style={{ minHeight: '40px' }}
          >
            <div>
              <span>1.5.0 powered by DSENT AG - an Inacta AG Company</span>
            </div>
            <div>
              <a href="https://github.com/inacta/tezos-webwallet">
                <AiFillGithub className="text-dark"/>
              </a>
            </div>
          </Navbar>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
