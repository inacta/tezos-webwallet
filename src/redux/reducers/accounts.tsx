import { Net } from '../../shared/TezosTypes';

const initalState = {
  [Net.Mainnet]: {
    privKey: '',
    address: ''
  },
  [Net.Testnet]: {
    privKey: '',
    address: ''
  }
};

export default function(state = initalState, action) {
  if (action.type === 'CHANGE_ADDRESS') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: {
          privKey: '',
          address: action.address
        },
        [Net.Testnet]: state[Net.Testnet]
      };
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Testnet]: {
          privKey: '',
          address: action.address
        }
      };
    }
    return state;
  }
  return state;
}
