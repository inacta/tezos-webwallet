import { Net, WalletTypes } from '../../shared/TezosTypes';

export interface IAccountState {
  [key: string]: {
    signer?: WalletTypes;
    address?: string;
    wallet?: boolean;
  };
}

const initalState: IAccountState = {
  [Net.Mainnet]: {
    signer: undefined,
    address: undefined,
    wallet: undefined
  },
  [Net.Carthage]: {
    signer: undefined,
    address: undefined,
    wallet: undefined
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function(state = initalState, action: any) {
  if (action.type === 'RESET_SIGNER') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: {
          signer: undefined,
          address: undefined,
          wallet: undefined
        },
        [Net.Carthage]: state[Net.Carthage]
      };
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Carthage]: {
          signer: undefined,
          address: undefined,
          wallet: undefined
        }
      };
    }
    action.asyncDispatch({
      type: 'SET_WALLET',
      network: action.network,
      wallet: undefined
    });
    action.asyncDispatch({
      type: 'SET_SIGNER',
      network: action.network,
      signer: undefined
    });
  } else if (action.type === 'CHANGE_ADDRESS') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: {
          signer: undefined,
          address: action.address,
          wallet: undefined
        },
        [Net.Carthage]: state[Net.Carthage]
      };
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Carthage]: {
          signer: undefined,
          address: action.address,
          wallet: undefined
        }
      };
    }
    return state;
  } else if (action.type === 'ADD_SIGNER') {
    if (action.network === Net.Mainnet) {
      state = {
        [Net.Mainnet]: {
          signer: action.signer,
          address: action.address,
          wallet: action.wallet
        },
        [Net.Carthage]: state[Net.Carthage]
      };
    } else {
      state = {
        [Net.Mainnet]: state[Net.Mainnet],
        [Net.Carthage]: {
          signer: action.signer,
          address: action.address,
          wallet: action.wallet
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
