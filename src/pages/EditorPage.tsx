import React, { useEffect } from 'react';
import { OptimizedWorkbenchLayout } from '../layout/OptimizedWorkbenchLayout';
import { useProjectStore } from '../store/useProjectStore';

const EditorPage: React.FC = () => {
  const { initApp } = useProjectStore();

  useEffect(() => {
    initApp();
  }, []);

  return <OptimizedWorkbenchLayout />;
};

export default EditorPage;
