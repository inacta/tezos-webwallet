import React from 'react';
import { store } from 'react-notifications-component';
import ProgressBar from 'react-bootstrap/ProgressBar';

export function addNotification(type: string, message: string): number {
  return store.addNotification({
    message,
    type,
    container: 'bottom-center',
    insert: 'top',
    animationIn: ['animated', 'fadeIn'],
    animationOut: ['animated', 'fadeOut'],
    dismiss: {
      duration: 3000,
      pauseOnHover: true,
      onScreen: true
    }
  });
}

export function removeNotification(id: number) {
  store.removeNotification(id);
}

export function addPermanentNotification(message: string): number {
  return store.addNotification({
    message: <NotificationProgressBar>{message}</NotificationProgressBar>,
    type: 'permanent',
    container: 'bottom-center',
    insert: 'top',
    animationIn: ['animated', 'fadeIn'],
    animationOut: ['animated', 'fadeOut'],
    dismiss: {
      duration: 0
    }
  });
}

function NotificationProgressBar(props: { children: string }) {
  return (
    <div className="d-flex flex-column align-items-center">
      <span className="mb-1">{props.children}</span>
      <ProgressBar animated now={100} style={{ height: '5px', width: '100%' }}></ProgressBar>
    </div>
  );
}
