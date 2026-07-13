import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import ErrorBoundary from "./components/ErrorBoundary";
import SplashScreen from "./pages/SplashScreen";
import ExecView from "./pages/ExecView";
import GroupOverview from "./pages/GroupOverview";
import CentreOperations from "./pages/CentreOperations";
import FindingsTracker from "./pages/FindingsTracker";
import Compliance from "./pages/Compliance";
import StandardsRegister from "./pages/StandardsRegister";
import KpiFramework from "./pages/KpiFramework";
import ReadinessPack from "./pages/ReadinessPack";
import BoardPack from "./pages/BoardPack";
import DeptReturn from "./pages/DeptReturn";

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  // Top-level boundary so a throw on the splash, the exec view or the theme
  // itself shows the recovery card instead of a blank page; keyed on the path
  // so navigating away from a broken route clears the error.
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/exec" element={<ExecView />} />
        <Route element={<ShellLayout />}>
          <Route path="/overview" element={<GroupOverview />} />
          <Route path="/centres/:centreId" element={<CentreOperations />} />
          <Route path="/centres/:centreId/readiness" element={<ReadinessPack />} />
          <Route path="/centres/:centreId/return" element={<DeptReturn />} />
          <Route path="/findings" element={<FindingsTracker />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/standards" element={<StandardsRegister />} />
          <Route path="/kpis" element={<KpiFramework />} />
          <Route path="/board-pack" element={<BoardPack />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
