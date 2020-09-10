import { combineReducers } from 'redux';
import network from './network';
import accounts from './accounts';
import net2client from './net2client';
import tokens from './tokens';
import persistRPC from './persistRPC';

export default combineReducers({ network, accounts, net2client, tokens, persistRPC });
