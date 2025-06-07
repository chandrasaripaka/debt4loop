import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Positions from "@/pages/positions";
import Loops from "@/pages/loops";
import Settlements from "@/pages/settlements";
import Wallet from "@/pages/wallet";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/positions" component={Positions} />
          <Route path="/loops" component={Loops} />
          <Route path="/settlements" component={Settlements} />
          <Route path="/wallet" component={Wallet} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
