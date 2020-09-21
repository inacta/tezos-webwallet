import { Net } from '../../shared/TezosTypes';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';

export function setNetwork(network: Net) {
  return {
    type: 'SET_NETWORK',
    network
  };
}

export function changeAddress(address: string, network: Net) {
  return {
    type: 'CHANGE_ADDRESS',
    address,
    network
  };
}

export function addSigner(address: string, network: Net, signer?: InMemorySigner | TezBridgeSigner) {
  return {
    type: 'ADD_SIGNER',
    signer,
    address,
    network
  };
}

export function setRPCProvider(network: Net, rpc: string) {
  return {
    type: 'PERSIST_PROVIDER',
    network,
    rpc
  };
}

export function addToken(network: Net, address: string, token) {
  return {
    type: 'ADD_TOKEN',
    network,
    address,
    token
  };
}

export function removeToken(network: Net, address: string) {
  return {
    type: 'REMOVE_TOKEN',
    network,
    address
  };
}
