import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Building, TrendingUp, Search, Handshake, Wallet, BarChart3, Coins } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: company } = useQuery({
    queryKey: ["/api/company/current"],
  });

  const { data: activeLoops } = useQuery({
    queryKey: ["/api/loops/active"],
  });

  const navItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/positions", label: "Positions", icon: TrendingUp },
    { path: "/loops", label: "Loop Detection", icon: Search, badge: activeLoops?.length || 0 },
    { path: "/settlements", label: "Settlements", icon: Handshake },
    { path: "/wallet", label: "DEBT Wallet", icon: Wallet },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white rounded-full relative">
              <div className="absolute inset-1 border border-white rounded-full"></div>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-dark-gray">Debtloop</h1>
            <p className="text-sm text-gray-500">v1.0 MVP</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-6 mb-6">
          <div className="bg-light-gray rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-dark-gray">DEBT Balance</span>
              <Coins className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-bold text-dark-gray">
              {company?.debtBalance?.toLocaleString() || "2,500"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Available for staking</div>
          </div>
        </div>
        
        <ul className="space-y-2 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <a
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-accent text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
