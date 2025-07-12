// pages/dashboard.js - Simplified to use the new AppLayout
import React from 'react';
import AppLayout from '../components/AppLayout'; // Use the new shared layout
import EnhancedPersonalizedDashboard from '@/components/EnhancedPersonalizedDashboard';

const DashboardPage = () => {
  return (
    <AppLayout>
      <EnhancedPersonalizedDashboard />
    </AppLayout>
  );
};

DashboardPage.auth = { requiredAuth: true };

export default DashboardPage;
