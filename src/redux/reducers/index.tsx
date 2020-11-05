import accounts from './accounts';
import { combineReducers } from 'redux';
import net2client from './net2client';
import network from './network';
import persistRPC from './persistRPC';
import tokens from './tokens';

export default combineReducers({ network, accounts, net2client, tokens, persistRPC });
