import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { WeddingProvider } from "./context";
import { Shell } from "./components/Shell";
import { HomePage } from "./pages/Home";
import { ChecklistPage } from "./pages/Checklist";
import { OrganizePage } from "./pages/Organize";
import { GuestsPage } from "./pages/Guests";
import { TablesPage } from "./pages/Tables";
import { ProgramPage } from "./pages/Program";
import { SettingsPage } from "./pages/Settings";

export default function App() {
  return (
    <WeddingProvider>
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tasks" element={<ChecklistPage />} />
            <Route path="/organize" element={<OrganizePage />} />
            <Route path="/guests" element={<GuestsPage />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/program" element={<ProgramPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </WeddingProvider>
  );
}
