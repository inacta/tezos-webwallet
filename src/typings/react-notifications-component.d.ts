declare module 'react-notifications-component' {
  import * as React from 'react';

  export default class extends React.Component<ReactNotificationProps> {}

  interface ReactNotificationProps {
    isMobile?: boolean;
    breakpoint?: number;
    types?: {
      htmlClasses: string[];
      name: string;
    }[];
    className?: string;
    id?: string;
  }

  const store: {
    addNotification: (options: ReactNotificationOptions) => string;
    removeNotification: (id: string) => void;
  };

  interface ReactNotificationOptions {
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

  interface TransitionOptions {
    duration?: number;
    timingFunction?: 'ease' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'step-start' | 'step-end';
    delay?: number;
  }

  interface DismissOptions {
    duration?: number;
    onScreen?: boolean;
    pauseOnHover?: boolean;
    waitForAnimation?: boolean;
    click?: boolean;
    touch?: boolean;
    showIcon?: boolean;
  }
}
