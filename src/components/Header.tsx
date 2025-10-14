import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from '../services/authService';
import { Menu, LogOut, Umbrella, ShoppingBag } from 'lucide-react';
import Button from './ui/Button';

const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  const isAdminPage = location.pathname.startsWith('/admin');
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <header className="py-6 bg-gradient-to-r from-primary via-secondary to-primary shadow-lg">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-white">
          <Umbrella size={32} className="text-white animate-float" />
          <span className="text-white">Parapli Bar & Grill</span>
        </Link>
        
        <div className="relative">
          <button 
            onClick={toggleMenu}
            className="flex items-center focus:outline-none text-white hover:text-gray-200 transition-colors"
            aria-expanded={isMenuOpen}
            aria-controls="navigation-menu"
          >
            <Menu size={24} />
          </button>
          
          {isMenuOpen && (
            <div 
              id="navigation-menu"
              className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl z-50 border border-gray-100"
            >
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500 border-b">
                    Signed in as<br />
                    <span className="font-medium text-primary">{user.email}</span>
                  </div>
                  
                  {isAdminPage ? (
                    <Link
                      to="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      View Menu
                    </Link>
                  ) : (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <Link
                    to="/admin/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingBag size={16} className="inline mr-1" />
                    Commandes
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-accent hover:bg-accent/5 transition-colors"
                  >
                    <LogOut size={16} className="inline mr-1" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Login
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;