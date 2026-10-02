import React from 'react';

const PaymentForm = ({
  selectedContact,
  amount,
  assetCode,
  assetIssuer,
  onAmountChange,
  onAssetCodeChange,
  onAssetIssuerChange,
  onSelectContact,
  onSend,
  onSendSac,
  contacts,
  isSacTransfer,
}) => {
  const isContract = selectedContact && selectedContact.address.startsWith('C');

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Send Payment</h3>
      
      <select
        value={selectedContact ? selectedContact.id : ''}
        onChange={(e) => {
          const contact = contacts.find(c => c.id === parseInt(e.target.value));
          onSelectContact(contact);
        }}
        style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
      >
        <option value="">Select a contact</option>
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contact.name} - {contact.address}
            {contact.address.startsWith('C') && ' [Contract]'}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Asset Code (XLM for native)"
        value={assetCode}
        onChange={(e) => onAssetCodeChange(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
      />

      {assetCode !== 'XLM' && (
        <input
          type="text"
          placeholder="Asset Issuer"
          value={assetIssuer}
          onChange={(e) => onAssetIssuerChange(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
      )}

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
      />

      {isContract ? (
        <button onClick={onSendSac} style={{ padding: '10px 20px', cursor: 'pointer', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px' }}>
          Transfer via SAC Contract
        </button>
      ) : (
        <button onClick={onSend} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Send Payment
        </button>
      )}
    </div>
  );
};

export default PaymentForm;
