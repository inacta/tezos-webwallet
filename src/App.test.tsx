// TODO: Remove eslint-disable for test files
/* eslint-disable */
import 'mocha';
import App from './App';
import React from 'react';
import { render } from '@testing-library/react';

test('renders text about balances', () => {
  const { getByText } = render(<App />),
    linkElement = getByText('Check Tezi and token balances');
  expect(linkElement).toBeInTheDocument();
});
