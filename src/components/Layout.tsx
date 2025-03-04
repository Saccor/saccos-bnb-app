import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        {token ? (
          <>
            <Link href="/properties" style={{ marginRight: '1rem' }}>
              Egendomar
            </Link>
            <Link href="/bookings" style={{ marginRight: '1rem' }}>
              Mina bokningar
            </Link>
            <button onClick={handleLogout}>Logga ut</button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ marginRight: '1rem' }}>
              Logga in
            </Link>
            <Link href="/register">
              Registrera
            </Link>
          </>
        )}
      </nav>
      <main style={{ padding: '1rem' }}>{children}</main>
    </div>
  );
} 