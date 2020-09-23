import { EnumDictionary } from '../../shared/AbstractTypes';
import { Net } from '../../shared/TezosTypes';
import { TezosToolkit } from '@taquito/taquito';

const initialState: EnumDictionary<Net, TezosToolkit> = {
  [Net.Mainnet]: new TezosToolkit(),
  [Net.Carthage]: new TezosToolkit()
};

export default function(state = initialState, action) {
  if (action.type === 'SET_RPC_PROVIDER') {
    state[action.network].setRpcProvider(action.rpc);
  } else if (action.type === 'SET_SIGNER') {
    state[action.network].setSignerProvider(action.signer);
  } else if (action.type === 'SET_WALLET') {
    state[action.network].setWalletProvider(action.wallet);
  }
  return state;
}
