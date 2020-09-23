import { Net, WalletTypes } from '../../shared/TezosTypes';

interface IAccountState {
  [key: string]: {
    signer?: WalletTypes;
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
  } else if (action.type === 'ADD_SIGNER') {
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
    if (action.wallet) {
      action.asyncDispatch({
        type: 'SET_WALLET',
        network: action.network,
        wallet: action.signer
      });
    } else {
      action.asyncDispatch({
        type: 'SET_SIGNER',
        network: action.network,
        signer: action.signer
      });
    }
    return state;
  }

  return state;
}
