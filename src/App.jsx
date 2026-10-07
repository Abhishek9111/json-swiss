import { useState } from 'react';
import { useToast } from './hooks/useToast';
import Header from './components/Header';
import ConvertView from './components/ConvertView';
import CompareView from './components/CompareView';
import QueryView from './components/QueryView';
import Toast from './components/Toast';

import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/diff.css';
import './styles/tree.css';
import './styles/query.css';
import './styles/toast.css';

export default function App() {
  const [mode, setMode] = useState('convert');
  const [convertStatus, setConvertStatus] = useState('empty');
  const { message, visible, toast } = useToast();

  return (
    <div className="app">
      <Header mode={mode} onModeChange={setMode} status={convertStatus} />
      <ConvertView active={mode === 'convert'} toast={toast} onStatusChange={setConvertStatus} />
      <CompareView active={mode === 'compare'} toast={toast} />
      <QueryView active={mode === 'query'} toast={toast} />
      <Toast message={message} visible={visible} />
    </div>
  );
}
