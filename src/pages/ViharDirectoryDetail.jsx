import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDirectoryRecords } from '../utils/directoryLoader';

const DIRECTORY_PROFILE_KEYS = [
  'Email Id',
  'First Name',
  'Middle Name',
  'Last Name',
  'Gender',
  'Blood Group',
  'Contact Number',
  'Address',
  'Area',
  'City',
  'Work Type',
  'Company / Business Name',
  'Occupation / Profession',
  'Office Location / Business Area',
];

function getPersonName(person) {
  if (!person) return '';
  const direct = String(person['Name'] || person.Name || person['Full Name'] || '').trim();
  if (direct) return direct;
  const first = String(person['First Name'] || person.FirstName || '').trim();
  const middle = String(person['Middle Name'] || person.MiddleName || '').trim();
  const last = String(person['Last Name'] || person.LastName || '').trim();
  return [first, middle, last].filter(Boolean).join(' ');
}

export default function ViharDirectoryDetail() {
  const { row } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const records = await fetchDirectoryRecords();
        const rowIndex = Number(row);
        const found = records.find((r) => Number(r._rowIndex) === rowIndex) || records[rowIndex - 1] || null;
        if (mounted) setPerson(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [row]);

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!person) return <div className="p-4">Person not found.</div>;

  const name = getPersonName(person) || person['Email Id'] || 'Unknown';

  const preferred = DIRECTORY_PROFILE_KEYS;
  const ignoredKeys = new Set(['Column 1', '_rowIndex', 'Sr No.', 'Sr no', 'Sr No']);

  const keys = [];
  preferred.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(person, k) && String(person[k] ?? '').trim() !== '') {
      keys.push(k);
    }
  });
  Object.keys(person).forEach((k) => {
    if (ignoredKeys.has(k)) return;
    if (preferred.includes(k)) return;
    if (String(person[k] ?? '').trim() === '') return;
    keys.push(k);
  });

  return (
    <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
      <header className="px-4 pt-4 pb-3 bg-[#C96800] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-white font-black text-base">{name}</h1>
      </header>

      <div className="scroll-area px-4 pt-5 pb-28 space-y-4">
        <div className="bg-white border border-[#F5E5B0] rounded-2xl p-4">
          <p className="font-black text-sm text-[#C96800]">Profile Details</p>
        </div>

        <div className="bg-white border border-[#F5E5B0] rounded-2xl p-4 space-y-3">
          {keys.map((key) => (
            <div key={key} className="flex gap-2">
              <span className="text-xs font-bold text-[#8B6525] w-36 flex-shrink-0">{key}</span>
              <span className="text-xs text-[#3D1F00] font-semibold flex-1">{String(person[key] ?? '')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
