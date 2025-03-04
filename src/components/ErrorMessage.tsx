import Link from 'next/link';

interface ErrorMessageProps {
  message: string;
  backUrl?: string;
  backText?: string;
  onBackClick?: () => void;
  type?: 'error' | 'warning';
}

export default function ErrorMessage({
  message,
  backUrl,
  backText = 'Tillbaka',
  onBackClick,
  type = 'error'
}: ErrorMessageProps) {
  const bgColor = type === 'error' ? 'bg-red-100' : 'bg-yellow-100';
  const borderColor = type === 'error' ? 'border-red-400' : 'border-yellow-400';
  const textColor = type === 'error' ? 'text-red-700' : 'text-yellow-700';

  return (
    <div className="container mx-auto py-8">
      <div className={`${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded`}>
        <p>{message}</p>
        {(backUrl || onBackClick) && (
          <div className="mt-4">
            {backUrl ? (
              <Link 
                href={backUrl}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                {backText}
              </Link>
            ) : (
              <button 
                onClick={onBackClick}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                {backText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 