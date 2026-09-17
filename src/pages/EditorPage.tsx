import React, { useEffect } from 'react';
import { WorkbenchLayout } from '../layout/WorkbenchLayout';
import { useProjectStore } from '../store/useProjectStore';
import { useShortcuts } from '../hooks/useShortcuts';

const EditorPage: React.FC = () => {
  const initApp = useProjectStore(s => s.initApp);

  useEffect(() => {
    initApp();
  }, []);

  useShortcuts();

  return <WorkbenchLayout />;
};

export default EditorPage;
