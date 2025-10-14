import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import NewsBar from './components/NewsBar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import OrdersPage from './pages/OrdersPage';
import { Clock, CreditCard, Wallet, Smartphone, Landmark } from 'lucide-react';

function App() {
  return (
    <Router>
      <AuthProvider>
        <MenuProvider>
          <CartProvider>
          <div className="min-h-screen flex flex-col bg-[#FFF9F2]">
            <Header />
            <NewsBar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/orders" element={<OrdersPage />} />
              </Routes>
            </main>
            <footer className="py-8 bg-gray-900 text-white">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-semibold text-primary mb-4">Opening Hours</h3>
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-gray-300">
                      <Clock size={20} className="text-primary" />
                      <span>Monday - Friday: 8am - 11pm</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-300">
                      <Clock size={20} className="text-primary" />
                      <span>Saturday - Sunday: 9am - 12pm</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-primary mb-4">Payment Methods</h3>
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex flex-col items-center">
                        <CreditCard size={24} className="text-primary mb-2" />
                        <span className="text-sm text-gray-300">Credit Card</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Wallet size={24} className="text-primary mb-2" />
                        <span className="text-sm text-gray-300">Cash</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Smartphone size={24} className="text-primary mb-2" />
                        <span className="text-sm text-gray-300">Mon Cash</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Landmark size={24} className="text-primary mb-2" />
                        <span className="text-sm text-gray-300">Bank Transfer</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right">
                    <h3 className="text-lg font-semibold text-primary mb-4">Contact</h3>
                    <p className="mb-2 text-gray-300">16 Rue Pomeyrac</p>
                    <p className="mb-2 text-gray-300">Delmas 95, Petion-Ville</p>
                    <p className="text-gray-300">Tel: (509) 4893-9310</p>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-400">
                  <p>&copy; {new Date().getFullYear()} Parapli Bar & Grill. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
          </CartProvider>
        </MenuProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;