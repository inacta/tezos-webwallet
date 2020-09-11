import { Net, TokenStandard } from '../../shared/TezosTypes';
import BigNumber from 'bignumber.js';

const initialState = {
  [Net.Mainnet]: {},
  [Net.Testnet]: {
    KT1JE97wUP7pmWRy7vKYHbuVoMnF9tcX4cY7: {
      type: TokenStandard.fa2,
      name: 'CVL',
      symbol: 'CVL',
      decimals: new BigNumber(8),
      extras: {
        'made by': 'inacta AG',
        developers: 'Thorkil Vaerge and Dominik Spicher'
      }
    }
  }
};

export default function(state = initialState, action) {
  if (action.type === 'ADD_TOKEN') {
    state = {
      ...state,
      [action.network]: {
        ...state[action.network],
        [action.address]: action.token
      }
    };
  } else if (action.type === 'REMOVE_TOKEN') {
    state = {
      ...state
    };
    delete state[action.network][action.address];
  }
  return state;
}
