import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import AddEntry from "./pages/AddEntry";
import EntryConfirm from "./pages/EntryConfirm";
import Entries from "./pages/Entries";
import Reports from "./pages/Reports";
import Rankings from "./pages/Rankings";
import ImportantContacts from "./pages/ImportantContacts";
import ViharDirectory from "./pages/ViharDirectory";
import ViharDirectoryDetail from "./pages/ViharDirectoryDetail";

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="flex flex-col h-full w-full max-w-[480px] mx-auto bg-[#FFFDF5] relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddEntry />} />
            <Route path="/confirm" element={<EntryConfirm />} />
            <Route path="/entries" element={<Entries />} />
            <Route path="/directory" element={<ViharDirectory />} />
            <Route path="/directory/:row" element={<ViharDirectoryDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/contacts" element={<ImportantContacts />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
