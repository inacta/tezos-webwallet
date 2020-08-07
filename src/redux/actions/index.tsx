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

export function setProvider(network: Net, rpc: string) {
  return {
    type: 'SET_PROVIDER',
    network,
    rpc
  };
}
