import { AVAILABILITY_LABELS, type Availability } from '@/lib/types';

const STYLES: Record<Availability, string> = {
  in_stock: 'bg-green-100 text-green-800 border-green-300',
  limited_stock: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  out_of_stock: 'bg-red-100 text-red-800 border-red-300',
  unknown: 'bg-slate-100 text-slate-700 border-slate-300',
  last_known_in_stock: 'bg-amber-50 text-amber-800 border-amber-300',
};

export default function AvailabilityBadge({ availability }: { availability: Availability }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[availability]}`}>
      {AVAILABILITY_LABELS[availability]}
    </span>
  );
}
