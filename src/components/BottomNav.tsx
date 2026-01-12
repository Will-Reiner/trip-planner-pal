import { useLocation, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ListChecks, Sparkles, Users, Trophy } from 'lucide-react';

const navItems = [
  { path: '/gastronomia', icon: UtensilsCrossed, label: 'Gastronomia' },
  { path: '/itens', icon: ListChecks, label: 'Itens' },
  { path: '/experience', icon: Sparkles, label: 'Experience' },
  { path: '/perfil', icon: Users, label: 'Perfil' },
  { path: 'https://pirimatch.astraflow.io', icon: Trophy, label: 'PiriMatch', external: true },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label, external }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => {
                if (external) {
                  window.open(path, '_blank');
                } else {
                  navigate(path);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200 ${
                isActive
                  ? 'text-primary scale-110'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
