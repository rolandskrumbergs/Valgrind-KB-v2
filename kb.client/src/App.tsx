import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminRoute } from "@/components/auth/admin-route";
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
import KnowledgeBaseDetailPage from "@/pages/knowledge-base-detail";

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
              <Route path="organizations" element={<AdminRoute><OrganizationsPage /></AdminRoute>} />
              <Route path="organizations/:id" element={<AdminRoute><OrganizationDetailPage /></AdminRoute>} />
              <Route path="members" element={<AdminRoute><MembersPage /></AdminRoute>} />
              <Route path="articles" element={<AdminRoute><ArticlesPage /></AdminRoute>} />
              <Route path="courses" element={<AdminRoute><CoursesPage /></AdminRoute>} />
              <Route path="knowledge-bases" element={<AdminRoute><KnowledgeBasesPage /></AdminRoute>} />
              <Route path="knowledge-bases/:id" element={<AdminRoute><KnowledgeBaseDetailPage /></AdminRoute>} />
              <Route path="ai-profiles" element={<AdminRoute><AiProfilesPage /></AdminRoute>} />
              <Route path="analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
              <Route path="manage-admins" element={<AdminRoute><ManageAdminsPage /></AdminRoute>} />
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