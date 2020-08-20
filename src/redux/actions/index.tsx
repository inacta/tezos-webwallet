import { Net } from '../../shared/TezosTypes';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';

export function switchNetwork() {
  return {
    type: 'SWITCH'
  };
}

export function changeAddress(address: string, network: Net) {
  return {
    type: 'CHANGE_ADDRESS',
    address,
    network
  };
}

export function addPrivateKey(address: string, network: Net, signer?: InMemorySigner | TezBridgeSigner) {
  return {
    type: 'ADD_PRIVATE_KEY',
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
