import React from 'react';
import { RefreshCw } from 'lucide-react';

interface EkyteSyncButtonProps {
  onSync: () => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

const EkyteSyncButton: React.FC<EkyteSyncButtonProps> = ({ onSync, disabled = false, compact = false }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    setIsLoading(true);
    try {
      await onSync();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm transition-colors shadow-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
        compact ? 'px-3 py-1.5' : 'px-4 py-2'
      }`}
      title="Sincronizar dados pela API da eKyte"
    >
      <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
      <span>{isLoading ? 'Sincronizando...' : 'Sincronizar eKyte'}</span>
    </button>
  );
};

export default EkyteSyncButton;
