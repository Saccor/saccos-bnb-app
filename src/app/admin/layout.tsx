import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Saccos BnB',
  description: 'Admin dashboard for managing properties and bookings',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 