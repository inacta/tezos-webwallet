import { EnumDictionary } from '../../shared/AbstractTypes';
import { IAccountState } from './accounts';
import { IPersistRPC } from './persistRPC';
import { ITokenState } from './tokens';
import { Net } from '../../shared/TezosTypes';
import { TezosToolkit } from '@taquito/taquito';
import accounts from './accounts';
import { combineReducers } from 'redux';
import net2client from './net2client';
import network from './network';
import persistRPC from './persistRPC';
import tokens from './tokens';

export interface IReduxState {
  network: Net;
  accounts: IAccountState;
  net2client: EnumDictionary<Net, TezosToolkit>;
  tokens: ITokenState;
  persistRPC: IPersistRPC;
}

export default combineReducers({ network, accounts, net2client, tokens, persistRPC });
