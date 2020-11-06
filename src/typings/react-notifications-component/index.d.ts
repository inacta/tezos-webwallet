import * as React from 'react';

declare module 'react-notifications-component' {
  export default class extends React.Component<ReactNotificationProps> {}

  export interface ReactNotificationProps {
    isMobile?: boolean;
    breakpoint?: number;
    types?: {
      htmlClasses: string[];
      name: string;
    }[];
    className?: string;
    id?: string;
  }

  export const store: {
    addNotification: (options: ReactNotificationOptions) => string;
    removeNotification: (id: string) => void;
  };

  export interface ReactNotificationOptions {
    id?: string;
    onRemoval?: (id: string, removedBy: any) => void;
    title?: string | React.ReactNode | React.FunctionComponent;
    message?: string | React.ReactNode | React.FunctionComponent;
    content?: React.ComponentClass | React.FunctionComponent | React.ReactNode;
    type?: 'success' | 'danger' | 'info' | 'default' | 'warning' | 'permanent';
    container: 'top-left' | 'top-right' | 'top-center' | 'center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
    insert?: 'top' | 'bottom';
    dismiss?: DismissOptions;
    animationIn?: string[];
    animationOut?: string[];
    slidingEnter?: TransitionOptions;
    slidingExit?: TransitionOptions;
    touchRevert?: TransitionOptions;
    touchSlidingExit?: TransitionOptions;
    width?: number;
  }

  export interface TransitionOptions {
    duration?: number;
    timingFunction?: 'ease' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'step-start' | 'step-end';
    delay?: number;
  }

  export interface DismissOptions {
    duration?: number;
    onScreen?: boolean;
    pauseOnHover?: boolean;
    waitForAnimation?: boolean;
    click?: boolean;
    touch?: boolean;
    showIcon?: boolean;
  }
}
