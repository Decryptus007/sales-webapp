'use client';

import React from 'react';

export function LocalStorageDebug() {
  const [storageData, setStorageData] = React.useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const invoicesData = localStorage.getItem('sales_invoices');
        console.log('Raw localStorage data:', invoicesData);

        if (invoicesData) {
          const parsed = JSON.parse(invoicesData);
          console.log('Parsed invoices:', parsed);
          setStorageData(parsed);
        } else {
          console.log('No invoices in localStorage');
          setStorageData([]);
        }
      } catch (error) {
        console.error('Error reading localStorage:', error);
        setStorageData({ error: error.message });
      }
    }
  }, []);

  if (!storageData) {
    return <div>Loading localStorage data...</div>;
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="font-bold mb-2">LocalStorage Debug</h3>
      <pre className="text-xs overflow-auto max-h-96">
        {JSON.stringify(storageData, null, 2)}
      </pre>
    </div>
  );
}