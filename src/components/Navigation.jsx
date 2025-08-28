import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sparkles, 
  Menu, 
  X, 
  Home, 
  MessageCircle, 
  User, 
  Crown, 
  Shield,
  LogOut,
  Settings
} from 'lucide-react';

export default function Navigation() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/features', label: 'Premium', icon: Crown, public: true },
    { path: '/dashboard', label: 'Dashboard', icon: MessageCircle, protected: true },
    { path: '/profile', label: 'Profilo', icon: User, protected: true },
    { path: '/subscription', label: 'Premium', icon: Crown, protected: true, premium: false },
    { path: '/admin', label: 'Admin', icon: Shield, admin: true }
  ];

  const filteredItems = navigationItems.filter(item => {
    if (item.public) return true;
    if (item.protected && !user) return false;
    if (item.admin && profile?.role !== 'admin') return false;
    if (item.premium === false && profile?.is_premium) return false;
    return true;
  });

  const NavLink = ({ item, mobile = false }) => (
    <Link
      to={item.path}
      onClick={() => mobile && setMobileMenuOpen(false)}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
        isActive(item.path)
          ? 'bg-blue-600 text-white'
          : mobile
          ? 'text-gray-300 hover:text-white hover:bg-white/10'
          : 'text-gray-300 hover:text-white hover:bg-white/10'
      } ${mobile ? 'w-full justify-start' : ''}`}
    >
      <item.icon className="w-4 h-4" />
      <span>{item.label}</span>
      {item.path === '/subscription' && !profile?.is_premium && (
        <span className="ml-auto px-2 py-1 text-xs bg-yellow-500 text-black rounded-full">
          Upgrade
        </span>
      )}
    </Link>
  );

  return (
    <nav className="glass-effect border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 sardinian-gradient rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SardAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {profile?.full_name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="text-white font-medium">{profile?.full_name}</p>
                    <p className="text-gray-400 text-xs">
                      {profile?.role === 'admin' ? '🛡️ Admin' : profile?.is_premium ? '👑 Premium' : '🆓 Gratuito'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="text-white hover:bg-white/10"
                >
                  Accedi
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="sardinian-gradient hover:opacity-90"
                >
                  Registrati
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white hover:bg-white/10"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Menu mobile"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-white/10 py-4"
              id="mobile-menu"
              role="menu"
            >
              <div className="space-y-2" role="none">
                {filteredItems.map((item) => (
                  <div key={item.path} role="menuitem">
                    <NavLink item={item} mobile />
                  </div>
                ))}
                
                {user ? (
                  <div className="pt-4 border-t border-white/10 mt-4">
                    <div className="flex items-center space-x-3 px-3 py-2 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {profile?.full_name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{profile?.full_name}</p>
                        <p className="text-gray-400 text-sm">
                          {profile?.role === 'admin' ? '🛡️ Admin' : profile?.is_premium ? '👑 Premium' : '🆓 Gratuito'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-white/10 mt-4 space-y-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        navigate('/login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-white hover:bg-white/10"
                    >
                      Accedi
                    </Button>
                    <Button 
                      onClick={() => {
                        navigate('/register');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full sardinian-gradient hover:opacity-90"
                    >
                      Registrati
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}