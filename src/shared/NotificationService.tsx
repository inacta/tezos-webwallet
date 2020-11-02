import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { store } from 'react-notifications-component';

export function addNotification(
  type: 'success' | 'danger' | 'info' | 'default' | 'warning',
  message: string,
  duration?: number
): string {
  return store.addNotification({
    message,
    type,
    container: 'bottom-center',
    insert: 'top',
    animationIn: ['animated', 'fadeIn'],
    animationOut: ['animated', 'fadeOut'],
    dismiss: {
      duration: duration ?? 3000,
      pauseOnHover: true,
      onScreen: true
    }
  });
}

export function removeNotification(id: string): void {
  store.removeNotification(id);
}

export function addPermanentNotification(message: string): string {
  return store.addNotification({
    message: <NotificationProgressBar>{message}</NotificationProgressBar>,
    type: 'info',
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
