import React from 'react';

const ContactList = ({ contacts, onSelect }) => {
  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Contacts</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {contacts.map((contact) => (
          <li key={contact.id} style={{ padding: '8px', margin: '5px 0', background: '#f5f5f5', borderRadius: '4px' }}>
            {contact.name} - {contact.address}
            {contact.address.startsWith('C') && <span style={{ color: 'blue', marginLeft: '10px' }}>[Contract]</span>}
            <button 
              onClick={() => onSelect(contact)}
              style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}
            >
              Select
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContactList;
