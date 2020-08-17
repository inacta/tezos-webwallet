import { store } from 'react-notifications-component';

export function addNotification(type: string, message: string) {
  store.addNotification({
    message,
    type,
    container: 'bottom-center',
    insert: 'top',
    animationIn: ['animated', 'fadeIn'],
    animationOut: ['animated', 'fadeOut'],
    dismiss: {
      duration: 3000,
      onScreen: true
    }
  });
}
