import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { DashboardPage } from "@/pages/dashboard";
import { ChatPage } from "@/pages/chat";
import { OrganizationsPage } from "@/pages/organizations";
import { MembersPage } from "@/pages/members";
import { ArticlesPage } from "@/pages/articles";
import { CoursesPage } from "@/pages/courses";
import { KnowledgeBasesPage } from "@/pages/knowledge-bases";
import { AiProfilesPage } from "@/pages/ai-profiles";
import { AnalyticsPage } from "@/pages/analytics";
import { ManageAdminsPage } from "@/pages/manage-admins";
import OrganizationDetailPage from "@/pages/organization-detail";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="organizations/:id" element={<OrganizationDetailPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="articles" element={<ArticlesPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="knowledge-bases" element={<KnowledgeBasesPage />} />
              <Route path="ai-profiles" element={<AiProfilesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="manage-admins" element={<ManageAdminsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;