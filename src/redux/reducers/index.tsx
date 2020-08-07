import { combineReducers } from 'redux';
import network from './network';
import accounts from './accounts';
import net2client from './net2client';

export default combineReducers({ network, accounts, net2client });
