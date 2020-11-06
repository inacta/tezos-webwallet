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

export class App extends React.Component<{}, {}> {
  public render() {
    return (
      <div className="d-flex flex-column h-100">
        <ReactNotification
          types={['permanent-notification']}
          // types={[
          //   {
          //     htmlClasses: ['permanent-notification'],
          //     name: 'permanent'
          //   }
          // ]}
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
          <Navbar bg="light" sticky="bottom" style={{ minHeight: '40px' }}>
            &copy; {new Date().getFullYear()} Inacta AG; by Daniel Gretzke and Thorkil Værge
          </Navbar>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
