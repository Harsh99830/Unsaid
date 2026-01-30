import React, { useState, useEffect, useContext, createContext } from 'react';

const GuestContext = createContext();

/**
 * GuestProvider component that manages guest user state
 * Handles guest-specific functionality and preferences
 */
export function GuestProvider({ children }) {
  const [isGuest, setIsGuest] = useState(true);
  const [guestPreferences, setGuestPreferences] = useState({
    theme: 'light',
    language: 'en',
    hasSeenOnboarding: false
  });

  useEffect(() => {
    // Load guest preferences from localStorage
    const savedPreferences = localStorage.getItem('guestPreferences');
    if (savedPreferences) {
      try {
        setGuestPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading guest preferences:', error);
      }
    }
  }, []);

  // Update guest preferences
  const updateGuestPreferences = (newPreferences) => {
    const updated = { ...guestPreferences, ...newPreferences };
    setGuestPreferences(updated);
    localStorage.setItem('guestPreferences', JSON.stringify(updated));
  };

  // Clear guest data when user logs in
  const clearGuestData = () => {
    setIsGuest(false);
    localStorage.removeItem('guestPreferences');
  };

  // Set guest mode
  const setGuestMode = (guest) => {
    setIsGuest(guest);
  };

  const value = {
    isGuest,
    guestPreferences,
    updateGuestPreferences,
    clearGuestData,
    setGuestMode
  };

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
}

/**
 * Custom hook to access guest functionality
 * @returns {Object} Guest state and functions
 */
export function useGuest() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
}