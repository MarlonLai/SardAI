import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
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

export default function Sidebar({ isOpen, onClose }) {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Arrivederci! 👋",
      description: "Logout effettuato con successo. A presto!"
    });
    navigate('/');
    onClose();
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: MessageCircle },
    { path: '/profile', label: 'Profilo', icon: User },
    ...(profile?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
    ...(!profile?.is_premium ? [{ path: '/subscription', label: 'Diventa Premium', icon: Crown, highlight: true }] : [])
  ];

  const NavItem = ({ item }) => (
    <Link
      to={item.path}
      onClick={onClose}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive(item.path)
          ? 'bg-blue-600 text-white'
          : item.highlight
          ? 'text-yellow-400 hover:bg-yellow-400/10'
          : 'text-gray-300 hover:text-white hover:bg-white/10'
      }`}
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.label}</span>
      {item.highlight && (
        <span className="ml-auto px-2 py-1 text-xs bg-yellow-500 text-black rounded-full">
          Upgrade
        </span>
      )}
    </Link>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        exit={{ x: -300 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-80 glass-effect border-r border-white/10 z-50 lg:static lg:translate-x-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link to="/" className="flex items-center space-x-3" onClick={onClose}>
            <div className="w-8 h-8 sardinian-gradient rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SardAI</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-blue-600 text-white">
                {profile?.full_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{profile?.full_name}</p>
              <p className="text-gray-400 text-sm">
                {profile?.role === 'admin' ? '🛡️ Admin' : profile?.is_premium ? '👑 Premium' : '🆓 Gratuito'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Button
            variant="ghost"
            onClick={() => {
              toast({
                title: "🚧 Funzionalità in arrivo!",
                description: "Le impostazioni saranno disponibili presto."
              });
            }}
            className="w-full justify-start text-white hover:bg-white/10"
          >
            <Settings className="w-4 h-4 mr-3" />
            Impostazioni
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </motion.div>
    </>
  );
}