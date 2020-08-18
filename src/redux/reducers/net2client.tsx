import { EnumDictionary } from '../../shared/AbstractTypes';
import { Net } from '../../shared/TezosTypes';
import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';

const initialState: EnumDictionary<Net, TezosToolkit> = {
  [Net.Mainnet]: new TezosToolkit(),
  [Net.Testnet]: new TezosToolkit()
};

export default function(state = initialState, action) {
  if (action.type === 'SET_RPC_PROVIDER') {
    state[action.network].setRpcProvider(action.rpc);
  } else if (action.type === 'SET_SIGNER') {
    state[action.network].setSignerProvider(new InMemorySigner(action.key));
  } else if (action.type === 'RESET_TOOLKIT') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: new TezosToolkit(),
        [Net.Testnet]: state[Net.Testnet]
      };
      state[Net.Mainnet].setRpcProvider('https://mainnet-tezos.giganode.io');
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Testnet]: new TezosToolkit()
      };
      state[Net.Testnet].setRpcProvider('https://api.tez.ie/rpc/carthagenet');
    }
  }
  return state;
}
