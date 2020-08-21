import { applyMiddleware, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import asyncDispatch from './middleware/asyncDispatch';
import rootReducer from './reducers';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

const persistConfig = {
  key: 'root',
  whitelist: ['network', 'tokens', 'persistRPC'],
  storage
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
const store = createStore(persistedReducer, applyMiddleware(asyncDispatch));
const persistor = persistStore(store);

export default () => {
  return { store, persistor };
};
