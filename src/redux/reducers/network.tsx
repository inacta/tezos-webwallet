import { Net } from '../../shared/TezosTypes';

const initialState = Net.Testnet;

export default function(state = initialState, action) {
  if (action.type === 'SWITCH') {
    if (state === Net.Mainnet) {
      state = Net.Testnet;
    } else {
      state = Net.Mainnet;
    }
  }
  return state;
}
