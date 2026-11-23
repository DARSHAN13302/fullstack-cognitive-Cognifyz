import React, { useEffect, useState } from 'react';

export default function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function loadItems() {
    const res = await fetch('/api/items');
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => { loadItems(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, status: 'open' })
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Failed to create item');
      return;
    }
    setTitle('');
    await loadItems();
  }

  async function handleDelete(id) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    await loadItems();
  }

  return (
    <main style={{ maxWidth: 680, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Task 5: React + Express REST CRUD (v7.0)</h1>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New engineering task..." aria-label="Task title" style={{ flex: 1, padding: 8 }} />
        <button type="submit">Add</button>
      </form>
      {error && <p role="alert" style={{ color: '#991b1b' }}>{error}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id} style={{ marginTop: 8 }}>
            <strong>{item.title}</strong> ({item.status}){' '}
            <button type="button" onClick={() => handleDelete(item.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
