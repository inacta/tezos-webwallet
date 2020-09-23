import { Net } from '../../shared/TezosTypes';

const initialState = {
  [Net.Mainnet]: 'https://mainnet-tezos.giganode.io',
  [Net.Carthage]: 'https://tezos-carthagenet.inacta.services/'
};

export default function(state = initialState, action) {
  if (action.type === 'PERSIST_PROVIDER') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: action.rpc,
        [Net.Carthage]: state[Net.Carthage]
      };
      action.asyncDispatch({
        type: 'SET_RPC_PROVIDER',
        network: Net.Mainnet,
        rpc: state[Net.Mainnet]
      });
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Carthage]: action.rpc
      };
      action.asyncDispatch({
        type: 'SET_RPC_PROVIDER',
        network: Net.Carthage,
        rpc: state[Net.Carthage]
      });
    }
  }

  // /* FIX FOR CODE REFACTORING */
  if (state[Net.Carthage] === undefined) {
    state = {
      [Net.Mainnet]: state[Net.Mainnet],
      [Net.Carthage]: 'https://tezos-carthagenet.inacta.services/'
    };
    action.asyncDispatch({
      type: 'SET_RPC_PROVIDER',
      network: Net.Carthage,
      rpc: action.payload === undefined ? state[Net.Carthage] : action.payload.persistRPC[Net.Carthage]
    });
    action.asyncDispatch({
      type: 'SET_RPC_PROVIDER',
      network: Net.Mainnet,
      rpc: action.payload === undefined ? state[Net.Mainnet] : action.payload.persistRPC[Net.Mainnet]
    });
  }

  // when the app loads, load the stored RPC url and set the provider in the client
  if (action.asyncDispatch !== undefined && action.type === 'persist/REHYDRATE') {
    action.asyncDispatch({
      type: 'SET_RPC_PROVIDER',
      network: Net.Carthage,
      rpc: action.payload === undefined ? state[Net.Carthage] : action.payload.persistRPC[Net.Carthage]
    });
    action.asyncDispatch({
      type: 'SET_RPC_PROVIDER',
      network: Net.Mainnet,
      rpc: action.payload === undefined ? state[Net.Mainnet] : action.payload.persistRPC[Net.Mainnet]
    });
  }
  return state;
}
