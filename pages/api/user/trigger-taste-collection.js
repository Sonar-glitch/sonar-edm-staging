// pages/api/user/trigger-taste-collection.js
// 🎵 TASTE COLLECTION TRIGGER API
// Redirects to real-taste-collection for actual implementation

export default async function handler(req, res) {
  // Redirect to the real implementation
  return res.redirect(307, '/api/user/real-taste-collection');
}