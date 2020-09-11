import { Net } from '../../shared/TezosTypes';
import { InMemorySigner } from '@taquito/signer';
import { TezBridgeSigner } from '@taquito/tezbridge-signer';

interface IAccountState {
  [key: string]: {
    signer?: InMemorySigner | TezBridgeSigner;
    address: string;
  };
}

const initalState: IAccountState = {
  [Net.Mainnet]: {
    signer: undefined,
    address: ''
  },
  [Net.Testnet]: {
    signer: undefined,
    address: ''
  }
};

export default function(state = initalState, action) {
  if (action.type === 'CHANGE_ADDRESS') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: {
          signer: undefined,
          address: action.address
        },
        [Net.Testnet]: state[Net.Testnet]
      };
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Testnet]: {
          signer: undefined,
          address: action.address
        }
      };
    }
    return state;
  } else if (action.type === 'ADD_PRIVATE_KEY') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: {
          signer: action.signer,
          address: action.address
        },
        [Net.Testnet]: state[Net.Testnet]
      };
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Testnet]: {
          signer: action.signer,
          address: action.address
        }
      };
    }
    action.asyncDispatch({
      type: 'SET_SIGNER',
      network: action.network,
      signer: action.signer
    });
    return state;
  }

  if (action.asyncDispatch !== undefined && action.type === 'persist/REHYDRATE') {
    state = {
      [Net.Mainnet]: state[Net.Mainnet],
      [Net.Testnet]: {
        signer: new TezBridgeSigner(),
        address: 'tz1QmL462eax1S2PvJC6TZdNg7TsxxfJSkzx'
      }
    };
    action.asyncDispatch({
      type: 'SET_SIGNER',
      network: Net.Testnet,
      signer: state[Net.Testnet].signer
    });
  }
  return state;
}
