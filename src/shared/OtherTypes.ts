import { Net } from './TezosTypes';
export interface IInfoMessage {
  class: string;
  clearCallback: () => void;
  message: string;
}

export interface IAction {
  address: string;
  network: Net;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [propName: string]: any;
  type: string;
}
