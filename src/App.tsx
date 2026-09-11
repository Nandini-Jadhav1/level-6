import React from 'react';
import { Layout } from './components/Layout';
import { RevenueSplit } from './components/RevenueSplit';

export const App: React.FC = () => {
  return (
    <Layout>
      <RevenueSplit />
    </Layout>
  );
};

export default App;
