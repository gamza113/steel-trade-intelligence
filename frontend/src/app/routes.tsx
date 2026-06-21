import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "../shared/layouts/MainLayout";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { CompetitorsPage } from "../features/competitors/CompetitorsPage";
import { FreightPage } from "../features/freight/FreightPage";
import { ImportPage } from "../features/imports/ImportPage";
import { MatchingPage } from "../features/matching/MatchingPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/map" element={<Navigate to="/" replace />} />
        <Route path="/suppliers" element={<div>Suppliers — coming soon</div>} />
        <Route path="/customers" element={<div>Customers — coming soon</div>} />
        <Route path="/products" element={<div>Products — coming soon</div>} />
        <Route path="/matching" element={<MatchingPage />} />
        <Route path="/competitors" element={<CompetitorsPage />} />
        <Route path="/freight" element={<FreightPage />} />
        <Route path="/imports" element={<ImportPage />} />
        <Route path="/settings" element={<div>Settings — coming soon</div>} />
        <Route path="/auth/login" element={<div>Login — coming soon</div>} />
      </Route>
    </Routes>
  );
}
