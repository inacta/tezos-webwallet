import { Net } from '../../shared/TezosTypes';

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

export function addPrivateKey(privateKey: string, address: string, network: Net) {
  return {
    type: 'ADD_PRIVATE_KEY',
    privateKey,
    address,
    network
  };
}

export function resetToolkit(network: Net) {
  return {
    type: 'RESET_TOOLKIT',
    network
  };
}

export function setProvider(network: Net, rpc: string) {
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
