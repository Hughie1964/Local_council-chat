import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Chat from "@/pages/Chat";
import Signup from "@/pages/Signup";
import Groups from "@/pages/Groups";
import GroupChatDetail from "@/pages/GroupChatDetail";
import { SuperUserDashboard } from "@/pages/SuperUserDashboard";
import UserTradeLog from "@/pages/UserTradeLog";
import News from "@/pages/News";
import NotFound from "@/pages/not-found";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationPopup } from "@/components/NotificationPopup";
import { NotificationDisplay } from "@/components/NotificationDisplay";
import { TestNotifications } from "@/components/TestNotifications";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route path="/signup" component={Signup} />
      <Route path="/groups" component={Groups} />
      <Route path="/groups/:groupId" component={GroupChatDetail} />
      <Route path="/super-user-dashboard" component={SuperUserDashboard} />
      <Route path="/my-trades" component={UserTradeLog} />
      <Route path="/news" component={News} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Router />
        <NotificationDisplay />
        <TestNotifications />
        <Toaster />
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
