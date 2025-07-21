import React from 'react';

const EventCard = ({ event }) => {
  if (!event) return null;
  
  const name = event.name || 'Unknown Event';
  const imageUrl = event.images && event.images[0] ? event.images[0].url : 'https://via.placeholder.com/300?text=No+Image';
  const date = event.date ? new Date(event.date).toLocaleDateString() : 'Date TBA';
  const venueName = event.venue && event.venue.name ? event.venue.name : 'Venue TBA';
  const location = event.venue && event.venue.location ? event.venue.location : 'Location TBA';
  const artists = event.artists || [];
  const ticketUrl = event.ticketUrl || '#';
  
  return (
    <div className="event-card">
      <div className="relative overflow-hidden h-48">
        <img 
          src={imageUrl} 
          alt={name} 
          className="card-image"
          loading="lazy"
          onError={(e) => {e.target.src = 'https://via.placeholder.com/300?text=No+Image'}}
        />
      </div>
      <div className="card-body">
        <h3 className="card-title">{name}</h3>
        <p className="text-sm mb-2"><strong>Date:</strong> {date}</p>
        <p className="text-sm mb-2"><strong>Venue:</strong> {venueName}</p>
        <p className="text-sm mb-3"><strong>Location:</strong> {location}</p>
        {artists.length > 0 && (
          <div className="flex flex-wrap mb-3">
            {artists.slice(0, 2).map((artist, i) => (
              <span key={i} className="badge-secondary">
                {typeof artist === 'string' ? artist : (artist.name || 'Unknown')}
              </span>
            ))}
          </div>
        )}
        <a 
          href={ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Get Tickets
        </a>
      </div>
    </div>
  );
};

export default EventCard;
