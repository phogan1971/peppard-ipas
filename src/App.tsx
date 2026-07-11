import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import GroupOverview from "./pages/GroupOverview";
import CentreOperations from "./pages/CentreOperations";
import FindingsTracker from "./pages/FindingsTracker";
import StandardsRegister from "./pages/StandardsRegister";
import KpiFramework from "./pages/KpiFramework";
import ReadinessPack from "./pages/ReadinessPack";
import BoardPack from "./pages/BoardPack";
import DeptReturn from "./pages/DeptReturn";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<GroupOverview />} />
        <Route path="/centres/:centreId" element={<CentreOperations />} />
        <Route path="/centres/:centreId/readiness" element={<ReadinessPack />} />
        <Route path="/centres/:centreId/return" element={<DeptReturn />} />
        <Route path="/findings" element={<FindingsTracker />} />
        <Route path="/standards" element={<StandardsRegister />} />
        <Route path="/kpis" element={<KpiFramework />} />
        <Route path="/board-pack" element={<BoardPack />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
