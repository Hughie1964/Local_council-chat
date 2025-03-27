import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Chat from "@/pages/Chat";
import Signup from "@/pages/Signup";
import Groups from "@/pages/Groups";
import GroupChatDetail from "@/pages/GroupChatDetail";
import SuperUserDashboard from "@/pages/SuperUserDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route path="/signup" component={Signup} />
      <Route path="/groups" component={Groups} />
      <Route path="/groups/:groupId" component={GroupChatDetail} />
      <Route path="/super-user-dashboard" component={SuperUserDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
