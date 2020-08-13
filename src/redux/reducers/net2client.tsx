import { EnumDictionary } from '../../shared/AbstractTypes';
import { Net } from '../../shared/TezosTypes';
import { TezosToolkit } from '@taquito/taquito';

const initialState: EnumDictionary<Net, TezosToolkit> = {
  [Net.Mainnet]: new TezosToolkit(),
  [Net.Testnet]: new TezosToolkit()
};

export default function(state = initialState, action) {
  if (action.type === 'SET_PROVIDER') {
    state[action.network].setProvider({
      rpc: action.rpc
    });
  } else if (action.type === 'RESET_TOOLKIT') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: new TezosToolkit(),
        [Net.Testnet]: state[Net.Testnet]
      };
      state[Net.Mainnet].setProvider({
        rpc: 'https://mainnet-tezos.giganode.io'
      });
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Testnet]: new TezosToolkit()
      };
      state[Net.Testnet].setProvider({
        rpc: 'https://api.tez.ie/rpc/carthagenet'
      });
    }
  }
  return state;
}
