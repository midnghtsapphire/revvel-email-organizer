import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import Home from "./pages/Home";
import CompassDashboard from "./pages/CompassDashboard";
import Inbox from "./pages/Inbox";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import FossCredits from "./pages/FossCredits";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/compass" component={CompassDashboard} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/settings" component={Settings} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/foss-credits" component={FossCredits} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AccessibilityProvider>
          <TooltipProvider>
            <Toaster
              toastOptions={{
                style: {
                  background: "oklch(0.2 0.012 55)",
                  border: "1px solid oklch(0.28 0.015 55)",
                  color: "oklch(0.88 0.025 75)",
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
