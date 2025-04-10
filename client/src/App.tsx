import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import ReelsPage from "@/pages/reels-page";
import SearchPage from "@/pages/search-page";
import ExplorePage from "@/pages/explore-page";
import MessagesPage from "@/pages/messages-page";
import NotificationsPage from "@/pages/notifications-page";
import CreatePage from "@/pages/create-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/profile/:username" component={ProfilePage} />
      <ProtectedRoute path="/reels" component={ReelsPage} />
      <ProtectedRoute path="/search" component={SearchPage} />
      <ProtectedRoute path="/explore" component={ExplorePage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/create" component={CreatePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
