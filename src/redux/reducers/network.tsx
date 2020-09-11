import { Net } from '../../shared/TezosTypes';

const initialState = Net.Testnet;

export default function(state = initialState, action) {
  if (action.type === 'SET_NETWORK') {
    state = action.network;
  }
  return state;
}
