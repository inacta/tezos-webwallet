import { Net } from '../../shared/TezosTypes';
import BigNumber from 'bignumber.js';

const initialState = {
  [Net.Mainnet]: {},
  [Net.Testnet]: {
    KT1JE97wUP7pmWRy7vKYHbuVoMnF9tcX4cY7: {
      name: 'CVL',
      symbol: 'CVL',
      decimals: new BigNumber(8),
      madeBy: 'inacta AG',
      developers: 'Thorkil Vaerge and Dominik Spicher'
    }
  }
};

export default function(state = initialState, action) {
  return state;
}
