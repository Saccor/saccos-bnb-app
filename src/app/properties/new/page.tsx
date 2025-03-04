'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PropertyForm from '@/components/PropertyForm';

export default function NewPropertyPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token in NewPropertyPage:', token ? `${token.substring(0, 20)}...` : 'No token found');
    
    if (!token) {
      console.log('No token found, redirecting to login');
      router.push('/login?redirect=/properties/new');
      return;
    }
    
    // Verify token validity
    const checkAuth = async () => {
      try {
        console.log('Making request to /api/auth/me with token');
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Response status from /api/auth/me:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('User data received:', userData);
          setIsAuthenticated(true);
        } else {
          // Token is invalid
          const errorData = await response.json();
          console.error('Authentication failed:', errorData);
          localStorage.removeItem('token');
          router.push('/login?redirect=/properties/new');
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        router.push('/login?redirect=/properties/new');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-8">
      <PropertyForm />
    </div>
  );
} 