# Sonar EDM Platform - Testing Guide

This document provides a comprehensive guide for testing all the fixes and improvements implemented in the Sonar EDM Platform.

## Prerequisites

Before testing, ensure you have:

1. Set up the required environment variables:
   - `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` (from Spotify Developer Dashboard)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (from Google Cloud Console)
   - `MONGODB_URI` (your MongoDB connection string)
   - `NEXTAUTH_SECRET` (a random string for session encryption)
   - `NEXTAUTH_URL` (your application URL)

2. Updated the callback URLs in both Spotify and Google developer dashboards:
   - Spotify: `https://your-app-url/api/auth/callback/spotify`
   - Google: `https://your-app-url/api/auth/callback/google`

## Testing Checklist

### 1. Authentication Testing

#### Music Fan Authentication (Spotify)
- [ ] Visit the homepage and click "Sign in as Music Fan"
- [ ] Verify you're redirected to Spotify authentication
- [ ] After authentication, verify you're redirected to the user dashboard
- [ ] Check that the session contains the correct user information

#### Promoter Authentication (Google)
- [ ] Visit the homepage and click "Sign in as Promoter"
- [ ] Verify you're redirected to Google authentication
- [ ] After authentication, verify you're redirected to the promoter dashboard
- [ ] Check that the session contains the correct user information

#### Sign-out Functionality
- [ ] Click the sign-out button in the header
- [ ] Verify you're redirected to the sign-out page
- [ ] Verify the session is terminated
- [ ] Verify you're redirected to the homepage after a brief delay

### 2. User Music Taste Analysis Testing

- [ ] Sign in as a music fan (Spotify)
- [ ] Navigate to the user dashboard
- [ ] Click on the "Music Taste" tab
- [ ] Verify the analysis loads correctly
- [ ] Test selecting different genres and artists
- [ ] Verify recommendations appear based on selections
- [ ] Test the back button functionality

### 3. Promoter Dashboard Analytics Testing

- [ ] Sign in as a promoter (Google)
- [ ] Navigate to the promoter dashboard
- [ ] Verify all tabs (Overview, Audience, Events, Revenue) load correctly
- [ ] Check that all charts and visualizations render properly
- [ ] Test interactive elements like filters and date ranges
- [ ] Verify data updates when changing filters

### 4. Shared Analytics Testing

- [ ] Sign in as either user type
- [ ] Navigate to the Analytics page
- [ ] Verify all tabs (Audience, Events, Music Trends) load correctly
- [ ] Check that all charts and visualizations render properly
- [ ] Test switching between tabs
- [ ] Verify insights sections display correctly

### 5. Responsive Design Testing

- [ ] Test all pages on desktop browsers (Chrome, Firefox, Safari)
- [ ] Test all pages on tablet devices (or simulated tablet viewport)
- [ ] Test all pages on mobile devices (or simulated mobile viewport)
- [ ] Verify navigation works correctly on all device sizes
- [ ] Check that charts and visualizations are responsive

### 6. Error Handling Testing

- [ ] Test authentication with invalid credentials
- [ ] Test accessing protected routes without authentication
- [ ] Simulate API failures and verify error messages
- [ ] Test with network throttling to verify loading states

## Troubleshooting Common Issues

### Authentication Issues
- Verify environment variables are correctly set
- Check callback URLs in Spotify and Google developer dashboards
- Ensure NEXTAUTH_URL matches your application URL
- Check browser console for any JavaScript errors

### Visualization Issues
- Verify Chart.js is properly loaded
- Check browser console for any JavaScript errors
- Ensure data format matches what Chart.js expects

### Layout Issues
- Clear browser cache and reload
- Verify all CSS files are properly loaded
- Check for any conflicting styles

## Deployment Verification

After deploying to production:
- Verify all environment variables are set in the production environment
- Test the authentication flow with real Spotify and Google accounts
- Verify analytics data is loading correctly
- Check all interactive elements are working as expected

If you encounter any issues during testing, please refer to the error messages in the browser console and server logs for troubleshooting.
