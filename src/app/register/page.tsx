'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    namn: '',
    epost: '',
    losenord: '',
    bekraftaLosenord: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.losenord !== formData.bekraftaLosenord) {
      setError('Lösenorden matchar inte');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          namn: formData.namn,
          epost: formData.epost,
          losenord: formData.losenord
        }),
      });

      if (response.ok) {
        router.push('/login?registered=true');
      } else {
        const data = await response.json();
        setError(data.message || 'Något gick fel vid registreringen');
      }
    } catch (err) {
      setError('Ett fel uppstod vid anslutning till servern');
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
        <h1 className="text-2xl font-bold mb-6 text-center">Registrera dig</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="namn" className="block text-sm font-medium text-gray-700">
              Namn
            </label>
            <input
              type="text"
              id="namn"
              name="namn"
              value={formData.namn}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

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
              minLength={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="bekraftaLosenord" className="block text-sm font-medium text-gray-700">
              Bekräfta lösenord
            </label>
            <input
              type="password"
              id="bekraftaLosenord"
              name="bekraftaLosenord"
              value={formData.bekraftaLosenord}
              onChange={handleChange}
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Registrera
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Har du redan ett konto?{' '}
          <Link href="/login" className="text-blue-500 hover:text-blue-700">
            Logga in här
          </Link>
        </p>
      </div>
    </div>
  );
} 