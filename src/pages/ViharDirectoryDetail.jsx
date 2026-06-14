import { useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, UserRound } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [person, setPerson] = useState(location.state?.person ?? null);
  const [loading, setLoading] = useState(!location.state?.person);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.person) {
      setPerson(location.state.person);
      setLoading(false);
      setError('');
      return;
    }

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
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [location.state, row]);

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
        <header className="px-4 pt-4 pb-3 bg-[#C96800] flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white p-2 rounded-xl hover:bg-orange-700" aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-white font-black text-base">Loading profile</h1>
        </header>

        <div className="scroll-area px-4 pt-5 pb-28">
          <div className="rounded-3xl border border-[#F5E5B0] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-[#FFF3D6] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-[#F5E5B0] animate-pulse" />
                <div className="h-3 w-48 rounded bg-[#FFF7E2] animate-pulse" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="space-y-2 rounded-2xl bg-[#FFFDF5] p-3 border border-[#F5E5B0]">
                  <div className="h-3 w-20 rounded bg-[#F5E5B0] animate-pulse" />
                  <div className="h-3 w-full rounded bg-[#FFF7E2] animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-[#F5E5B0] bg-white p-4 text-sm text-[#8B6525]">
            <LoaderCircle size={16} className="animate-spin text-[#C96800]" />
            Fetching the profile details…
          </div>
        </div>
      </div>
    );
  }
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
