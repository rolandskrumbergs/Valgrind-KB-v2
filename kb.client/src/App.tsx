import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoginPage } from "@/pages/login";
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

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
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
    </BrowserRouter>
  );
}

export default App;