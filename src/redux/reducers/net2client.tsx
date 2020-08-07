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
    return state;
  }
  state[Net.Mainnet].setProvider({
    rpc: 'https://mainnet-tezos.giganode.io'
  });
  state[Net.Testnet].setProvider({
    rpc: 'https://api.tez.ie/rpc/carthagenet'
  });
  return state;
}
