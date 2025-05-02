'use client';

interface PriceSummaryProps {
  totalPrice: number;
  nights: number;
}

export default function PriceSummary({ totalPrice, nights }: PriceSummaryProps) {
  if (nights <= 0) {
    return null;
  }
  
  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <p className="text-lg font-semibold">
        Totalt pris: {totalPrice} kr ({nights} nätter)
      </p>
    </div>
  );
} 