import { IAction } from '../../shared/OtherTypes';
import { Net } from '../../shared/TezosTypes';

export interface ITokenState {
  [Net.Mainnet]: object;
  [Net.Carthage]: object;
}

const initialState: ITokenState = {
  [Net.Mainnet]: {},
  [Net.Carthage]: {
    // KT1JE97wUP7pmWRy7vKYHbuVoMnF9tcX4cY7: {
    //   type: TokenStandard.FA2,
    //   name: 'CVL',
    //   symbol: 'CVL',
    //   decimals: new BigNumber(8),
    //   extras: {
    //     'made by': 'inacta AG',
    //     developers: 'Thorkil Vaerge and Dominik Spicher'
    //   }
    // }
  }
};

export default function(state = initialState, action: IAction): ITokenState {
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
    // @ts-ignore
    delete state[action.network][action.address];
  }

  /* FIX FOR CODE REFACTORING */
  if (state[Net.Carthage] === undefined) {
    // @ts-ignore
    state[Net.Carthage] = state['Testnet'];
    // @ts-ignore
    delete state['Testnet'];
  }

  return state;
}
