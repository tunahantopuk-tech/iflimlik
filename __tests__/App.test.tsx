import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_API_URL: 'https://test.api.com/',
    },
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('App', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />);
    expect(getByText).toBeDefined();
  });
});
