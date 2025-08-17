import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import React from 'react';
import AppLayout from '../components/AppLayout';
import Link from 'next/link';

export default function MyEventsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch('/api/events/cached-enhanced');
        if (res.ok) {
          const json = await res.json();
          setEvents(json.events || []);
        } else { setError(`API ${res.status}`); }
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, [session, status]);

  if (status === 'loading') return <div style={container}>Loading...</div>;
  if (!session) return <div style={container}>Please <Link href="/api/auth/signin">sign in</Link> to view favourites.</div>;
  if (loading) return <div style={container}>Loading your favourite events...</div>;
  if (error) return <div style={container}>Error: {error}</div>;

  return (
    <AppLayout>
    <div style={container}>
      <h1 style={title}>Favourites</h1>
      {events.length === 0 && <p style={muted}>No events saved yet. (Stub page)</p>}
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', width: '100%', maxWidth: 800 }}>
        {events.slice(0,25).map(ev => (
          <li key={ev._id || ev.id} style={card}>
            <strong>{ev.name}</strong><br/>
            <span style={muted}>{ev.date}</span>
          </li>
        ))}
      </ul>
  </div>
  </AppLayout>
  );
}

const container = { minHeight: '100vh', background: '#0d0f17', padding: '2rem', color: '#fff', fontFamily: 'system-ui, sans-serif' };
const title = { margin: 0, fontSize: '1.75rem', background: 'linear-gradient(90deg,#00CFFF,#FF00CC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' };
const muted = { color: '#888', fontSize: '.85rem' };
const card = { background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: 8 };
