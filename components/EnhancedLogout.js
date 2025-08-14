// components/EnhancedLogout.js
// 🔐 ENHANCED LOGOUT COMPONENT
// Handles proper logout with Spotify token revocation and account deletion

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from '../styles/EnhancedLogout.module.css';

export default function EnhancedLogout({ trigger = 'button', onLogout }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      console.log('🔐 Starting enhanced logout...');
      
      // Step 1: Call our logout API to revoke Spotify token
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (logoutResponse.ok) {
        const result = await logoutResponse.json();
        console.log('✅ Server logout completed:', result);
      } else {
        console.warn('⚠️ Server logout failed, proceeding with client logout');
      }

      // Step 2: Sign out with NextAuth (clears local session)
      await signOut({ 
        redirect: false  // Don't auto-redirect, we'll handle it
      });

      console.log('✅ Client session cleared');

      // Step 3: Callback and redirect
      onLogout?.();
      router.push('/');

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback: still try to sign out locally
      await signOut({ redirect: false });
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      console.log('🗑️ Starting account deletion...');
      
      // Delete user profile
      const deleteResponse = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (deleteResponse.ok) {
        const result = await deleteResponse.json();
        console.log('✅ Account deleted:', result);
        
        // Now logout
        await handleLogout();
      } else {
        const error = await deleteResponse.json();
        console.error('❌ Account deletion failed:', error);
        alert(`Failed to delete account: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Account deletion error:', error);
      alert('An error occurred while deleting your account');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (trigger === 'dropdown') {
    return (
      <div className={styles.dropdownContainer}>
        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={styles.dropdownItem}
        >
          {isLoggingOut ? 'Logging out...' : 'Sign Out'}
        </button>
        
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className={`${styles.dropdownItem} ${styles.deleteItem}`}
        >
          Delete Account
        </button>

        {showDeleteConfirm && (
          <div className={styles.deleteConfirmModal}>
            <div className={styles.modalContent}>
              <h3>Delete Account</h3>
              <p>This will permanently delete your profile and force a fresh onboarding experience.</p>
              <p>Are you sure you want to continue?</p>
              
              <div className={styles.modalButtons}>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className={styles.deleteButton}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={styles.logoutButton}
    >
      {isLoggingOut ? 'Logging out...' : 'Sign Out'}
    </button>
  );
}
