import React from 'react';

const TransactionHistory = ({ transactions }) => {
  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Transaction History</h3>
      {transactions.length === 0 ? (
        <p>No transactions yet</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {transactions.map((tx, index) => (
            <li key={index} style={{ padding: '8px', margin: '5px 0', background: '#f5f5f5', borderRadius: '4px' }}>
              <div>Hash: {tx.hash || 'N/A'}</div>
              <div>Status: {tx.status || 'PENDING'}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistory;
