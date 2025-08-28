import React, { memo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useToast } from '@/components/ui/use-toast';
import { 
  Sparkles, 
  X, 
  MessageCircle, 
  User, 
  Crown, 
  Shield,
  LogOut,
  Settings,
  Home
} from 'lucide-react';

const NavItem = memo(({ item, onClose, isActive }) => (
  <Link
    to={item.path}
    onClick={onClose}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800 ${
      isActive
        ? 'bg-blue-600 text-white'
        : item.highlight
        ? 'text-yellow-400 hover:bg-yellow-400/10'
        : 'text-gray-300 hover:text-white hover:bg-white/10'
    }`}
    aria-current={isActive ? 'page' : undefined}
    role="menuitem"
  >
    <item.icon className="w-5 h-5" aria-hidden="true" />
    <span className="font-medium">{item.label}</span>
    {item.highlight && (
      <span className="ml-auto px-2 py-1 text-xs bg-yellow-500 text-black rounded-full">
        Upgrade
      </span>
    )}
  </Link>
));

NavItem.displayName = 'NavItem';

const OptimizedSidebar = memo(({ isOpen, onClose }) => {
  const { displayInfo, permissions, optimizedLogout } = useOptimizedAuth();
  const location = useLocation();
  const { toast } = useToast();

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  const handleLogout = useCallback(async () => {
    const result = await optimizedLogout();
    if (result.success) {
      toast({
        title: "Arrivederci! 👋",
        description: "Logout effettuato con successo. A presto!"
      });
      onClose();
    }
  }, [optimizedLogout, toast, onClose]);

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: MessageCircle },
    { path: '/features', label: 'Funzionalità Premium', icon: Crown },
    { path: '/profile', label: 'Profilo', icon: User },
    ...(permissions.isAdmin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
    ...(!permissions.isPremium ? [{ path: '/subscription', label: 'Diventa Premium', icon: Crown, highlight: true }] : [])
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        exit={{ x: -300 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-80 glass-effect border-r border-white/10 z-50 lg:static lg:translate-x-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link 
            to="/" 
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg p-1" 
            onClick={onClose}
            aria-label="Vai alla homepage di SardAI"
          >
            <div className="w-8 h-8 sardinian-gradient rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-white">SardAI</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-white hover:bg-white/10"
            aria-label="Chiudi menu laterale"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Profile */}
        {displayInfo && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={displayInfo.avatarUrl} alt={`Avatar di ${displayInfo.name}`} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {displayInfo.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{displayInfo.name}</p>
                <p className="text-gray-400 text-sm">
                  {permissions.isAdmin ? '🛡️ Admin' : permissions.isPremium ? '👑 Premium' : '🆓 Gratuito'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2" role="menu" aria-label="Menu principale">
            {navigationItems.map((item) => (
              <NavItem 
                key={item.path} 
                item={item} 
                onClose={onClose}
                isActive={isActive(item.path)}
              />
            ))}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Button
            variant="ghost"
            onClick={() => {
              toast({
                title: "🚧 Impostazioni disponibili!",
                description: "Vai al profilo per accedere alle impostazioni complete."
              });
              onClose();
            }}
            className="w-full justify-start text-white hover:bg-white/10 focus:ring-2 focus:ring-blue-400"
            aria-label="Vai alle impostazioni"
          >
            <Settings className="w-4 h-4 mr-3" />
            Impostazioni
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10 focus:ring-2 focus:ring-red-400"
            aria-label="Esci dall'account"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </motion.div>
    </>
  );
});

OptimizedSidebar.displayName = 'OptimizedSidebar';

export default OptimizedSidebar;