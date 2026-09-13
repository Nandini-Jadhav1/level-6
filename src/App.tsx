import React from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { Layout } from './components/Layout';
import { RevenueSplit } from './components/RevenueSplit';

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <Layout>
        <RevenueSplit />
      </Layout>
    </WalletProvider>
  );
};

export default App;
