import { Net } from '../../shared/TezosTypes';

const initialState = {
  [Net.Mainnet]: 'https://mainnet-tezos.giganode.io',
  [Net.Testnet]: 'https://api.tez.ie/rpc/carthagenet'
};

export default function(state = initialState, action) {
  if (action.type === 'PERSIST_PROVIDER') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: action.rpc,
        [Net.Testnet]: state[Net.Testnet]
      };
      action.asyncDispatch({
        type: 'SET_PROVIDER',
        network: Net.Mainnet,
        rpc: state[Net.Mainnet]
      });
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Testnet]: action.rpc
      };
      action.asyncDispatch({
        type: 'SET_PROVIDER',
        network: Net.Testnet,
        rpc: state[Net.Testnet]
      });
    }
  }
  // when the app loads, load the stored RPC url and set the provider in the client
  if (action.asyncDispatch !== undefined && action.type === 'persist/REHYDRATE') {
    action.asyncDispatch({
      type: 'SET_PROVIDER',
      network: Net.Testnet,
      rpc: state[Net.Testnet]
    });
    action.asyncDispatch({
      type: 'SET_PROVIDER',
      network: Net.Mainnet,
      rpc: state[Net.Mainnet]
    });
  }
  return state;
}
