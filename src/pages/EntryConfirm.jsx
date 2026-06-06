import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Copy, List, Plus } from 'lucide-react';
import { useState } from 'react';
import { buildWhatsAppMessage } from '../utils/formatters';
import Toast from '../components/Toast';

export default function EntryConfirm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const entry = state?.entry;
  if (!entry) {
    navigate('/');
    return null;
  }

  const msg = buildWhatsAppMessage(entry);

  function copyToClipboard() {
    navigator.clipboard.writeText(msg).then(() => {
      setToast({ message: 'Copied to clipboard!', type: 'success' });
    });
  }

  return (
    <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5]">
      <div className="scroll-area px-4 pt-8 space-y-5 flex flex-col items-center">
        <CheckCircle size={64} className="text-green-600" />
        <h1 className="font-black text-2xl text-[#3D1F00]">Vihar Saved!</h1>
        <p className="text-[#8B6525] text-sm font-semibold">Vihar No. {entry.viharNo} has been saved.</p>

        {/* WhatsApp message */}
        <div className="w-full min-w-0">
          <pre className="bg-[#DCF8C6] rounded-2xl p-4 text-xs text-[#3D1F00] whitespace-pre-wrap break-words font-sans border border-green-200 max-w-full overflow-x-hidden">
            {msg}
          </pre>
        </div>

        <button
          onClick={copyToClipboard}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-black rounded-xl py-3.5 text-base"
        >
          <Copy size={18} /> Copy for WhatsApp
        </button>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Link
            to="/entries"
            className="flex items-center justify-center gap-2 border border-[#C96800] text-[#C96800] font-bold rounded-xl py-3 text-sm"
          >
            <List size={16} /> View Vihar Entries
          </Link>
          <Link
            to="/add"
            className="flex items-center justify-center gap-2 bg-[#C96800] text-white font-bold rounded-xl py-3 text-sm"
          >
            <Plus size={16} /> Add New Entry
          </Link>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
