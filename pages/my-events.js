import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import AppLayout from '../components/AppLayout';
import Link from 'next/link';

export default function MyEventsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  const loadFavourites = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const res = await fetch('/api/user/favourites');
      if (res.ok) {
        const json = await res.json();
        setEvents(json.favourites || []);
      } else { setError(`API ${res.status}`); }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [session]);

  useEffect(() => { if (status === 'authenticated') loadFavourites(); if (status==='unauthenticated') setLoading(false); }, [status, loadFavourites]);

  // Real-time sync when favouritesUpdated event fires
  useEffect(() => {
    const handler = (e) => {
      const { eventId, action } = e.detail || {};
      if (!eventId) return;
      setEvents(prev => {
        const exists = prev.find(ev => (ev._id||ev.id) === eventId);
        if (action === 'added') {
          if (exists) return prev;
          // Lazy fetch that single event from API by reloading all (small list)
          loadFavourites();
          return prev;
        } else if (action === 'removed') {
          return prev.filter(ev => (ev._id||ev.id) !== eventId);
        }
        return prev;
      });
    };
    window.addEventListener('favouritesUpdated', handler);
    return () => window.removeEventListener('favouritesUpdated', handler);
  }, [loadFavourites]);

  if (status === 'loading') return <div style={container}>Loading...</div>;
  if (!session) return <div style={container}>Please <Link href="/api/auth/signin">sign in</Link> to view favourites.</div>;
  if (loading) return <div style={container}>Loading your favourite events...</div>;
  if (error) return <div style={container}>Error: {error}</div>;

  return (
    <AppLayout>
    <div style={container}>
      <h1 style={title}>Favourites</h1>
  {events.length === 0 && <p style={muted}>You have not saved any events yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', width: '100%', maxWidth: 900, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
        {events.slice(0,25).map(ev => {
          const id = ev._id || ev.id;
          const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('en-US',{month:'short', day:'numeric'}) : 'Date TBD';
          const img = ev.image || (Array.isArray(ev.images) && ev.images[0]?.url);
          const artists = Array.isArray(ev.artists) ? ev.artists.slice(0,3).map(a=> typeof a==='string'? a : a?.name).filter(Boolean).join(', ') : '';
          return (
            <li key={id} style={card} title={ev.demo ? 'Demo event' : 'Live event'}>
              {img && <div style={{width:'100%',height:120,overflow:'hidden',borderRadius:6,marginBottom:8,background:'#111'}}>
                <img src={img} alt={ev.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              </div>}
              <strong style={{display:'block',fontSize:14,lineHeight:1.2, marginBottom:4}}>{ev.name}</strong>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{...muted,fontSize:12}}>{dateStr}</span>
                <button onClick={async ()=>{
                  try { await fetch(`/api/user/favourites?eventId=${id}`, { method:'DELETE'}); }
                  catch{}
                  setEvents(list=> list.filter(e => (e._id||e.id)!==id));
                  try { window.dispatchEvent(new CustomEvent('favouritesUpdated', { detail:{ eventId:id, action:'removed'} })); } catch {}
                }} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'#fff',fontSize:10,padding:'4px 8px',borderRadius:12,cursor:'pointer'}}>Unsave</button>
              </div>
              {artists && <div style={{fontSize:11,color:'#ccc',marginBottom:6}}>{artists}</div>}
              {ev.venue && <div style={{fontSize:11,color:'#999'}}>{typeof ev.venue==='object'? ev.venue?.name : ev.venue}</div>}
              {ev.demo && <span style={{...badge}}>DEMO</span>}
            </li>
          );
        })}
      </ul>
    </div>
  </AppLayout>
  );
}

const container = { minHeight: '100vh', background: '#0d0f17', padding: '2rem', color: '#fff', fontFamily: 'system-ui, sans-serif' };
const title = { margin: 0, fontSize: '1.75rem', background: 'linear-gradient(90deg,#00CFFF,#FF00CC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' };
const muted = { color: '#888', fontSize: '.85rem' };
const card = { background: 'rgba(255,255,255,0.05)', padding: '0.75rem 0.75rem', borderRadius: 10, position:'relative', display:'flex',flexDirection:'column' };
const badge = { position:'absolute', top:6, right:8, background:'rgba(255,0,110,0.15)', color:'#ff4fa3', padding:'2px 6px', fontSize:10, borderRadius:4, letterSpacing:0.5 };
