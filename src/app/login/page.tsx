'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/properties';
  
  const [formData, setFormData] = useState({
    epost: '',
    losenord: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful, token received:', data.token.substring(0, 20) + '...');
        
        // Store the token in localStorage
        localStorage.setItem('token', data.token);
        
        // Log the stored token to verify it's stored correctly
        const storedToken = localStorage.getItem('token');
        console.log('Token stored in localStorage:', storedToken?.substring(0, 20) + '...');
        
        // Redirect to the requested page or properties page
        router.push(redirectPath);
      } else {
        const data = await response.json();
        setError(data.message || 'Något gick fel vid inloggningen');
      }
    } catch (err) {
      setError('Ett fel uppstod vid anslutning till servern');
      console.error('Login error:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Logga in</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="epost" className="block text-sm font-medium text-gray-700">
              E-post
            </label>
            <input
              type="email"
              id="epost"
              name="epost"
              value={formData.epost}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="losenord" className="block text-sm font-medium text-gray-700">
              Lösenord
            </label>
            <input
              type="password"
              id="losenord"
              name="losenord"
              value={formData.losenord}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Logga in
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Har du inget konto?{' '}
          <Link href="/register" className="text-blue-500 hover:text-blue-700">
            Registrera dig här
          </Link>
        </p>
      </div>
    </div>
  );
} 