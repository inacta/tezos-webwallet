// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (store: any) => (next: any) => (action: any) => {
  let syncActivityFinished = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let actionQueue: any[] = [];

  function flushQueue() {
    actionQueue.forEach((a) => store.dispatch(a)); // flush queue
    actionQueue = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function asyncDispatch(asyncAction: any) {
    actionQueue = actionQueue.concat([asyncAction]);

    if (syncActivityFinished) {
      flushQueue();
    }
  }

  const actionWithAsyncDispatch = Object.assign({}, action, { asyncDispatch });

  next(actionWithAsyncDispatch);
  syncActivityFinished = true;
  flushQueue();
};
