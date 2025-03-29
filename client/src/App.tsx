import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Chat from "@/pages/Chat";
import AuthPage from "@/pages/auth-page";
import VerifyEmailPage from "@/pages/verify-email";
import Groups from "@/pages/Groups";
import GroupChatDetail from "@/pages/GroupChatDetail";
import { SuperUserDashboard } from "@/pages/SuperUserDashboard";
import UserTradeLog from "@/pages/UserTradeLog";
import News from "@/pages/News";
import NotFound from "@/pages/not-found";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationDisplay } from "@/components/NotificationDisplay";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Chat} />
      <ProtectedRoute path="/groups" component={Groups} />
      <ProtectedRoute path="/groups/:groupId" component={GroupChatDetail} />
      <ProtectedRoute path="/super-user-dashboard" component={SuperUserDashboard} />
      <ProtectedRoute path="/my-trades" component={UserTradeLog} />
      <ProtectedRoute path="/news" component={News} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router />
          <NotificationDisplay />
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
