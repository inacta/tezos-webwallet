import { Net } from '../../shared/TezosTypes';

const initialState = Net.Mainnet;

export default function(state = initialState, action) {
  if (action.type === 'SET_NETWORK') {
    state = action.network;
  }

  if (!(state in Net)) {
    state = Net.Mainnet;
  }

  return state;
}
