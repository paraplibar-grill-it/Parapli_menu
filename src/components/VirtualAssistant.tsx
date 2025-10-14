import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orderService';
import { toast } from 'react-hot-toast';

const VirtualAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [showTablePrompt, setShowTablePrompt] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { cart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartItemCount } = useCart();

  const handleOpenCart = () => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    setIsOpen(true);
  };

  const handleProceedToOrder = () => {
    setShowTablePrompt(true);
  };

  const handlePlaceOrder = async () => {
    if (!tableNumber || tableNumber <= 0) {
      toast.error('Veuillez entrer un numéro de table valide');
      return;
    }

    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    try {
      const orderItems = cart.map(({ item, quantity }) => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity
      }));

      await createOrder(tableNumber, orderItems);
      clearCart();
      setShowTablePrompt(false);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setIsOpen(false);
        setTableNumber(null);
      }, 3000);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Erreur lors de la commande. Veuillez réessayer.');
    }
  };

  return (
    <>
      <button
        onClick={handleOpenCart}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Ouvrir le panier"
      >
        <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
            {cartItemCount}
          </span>
        )}
      </button>

      {isOpen && !showTablePrompt && !showSuccessMessage && (
        <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[450px] h-[calc(100vh-2rem)] sm:h-[700px] max-h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              <div>
                <h3 className="font-bold text-base sm:text-lg">Votre Panier</h3>
                <p className="text-xs text-orange-100">{cartItemCount} article{cartItemCount > 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-orange-500 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-base sm:text-lg">Votre panier est vide</p>
                <p className="text-gray-400 text-sm mt-2">Parcourez le menu et ajoutez des articles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(({ item, quantity }) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h5 className="font-bold text-gray-800 text-sm sm:text-base">{item.name}</h5>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                        <p className="text-base sm:text-lg font-bold text-orange-600 mt-2">{item.price} HTG</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, quantity - 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <span className="w-8 sm:w-10 text-center font-semibold text-gray-800 text-sm sm:text-base">{quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, quantity + 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-800 text-sm sm:text-base">
                        {(item.price * quantity).toFixed(0)} HTG
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 p-3 sm:p-4">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <span className="text-base sm:text-lg font-bold text-gray-800">Total:</span>
                <span className="text-xl sm:text-2xl font-bold text-orange-600">{cartTotal.toFixed(0)} HTG</span>
              </div>
              <button
                onClick={handleProceedToOrder}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2.5 sm:py-3 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-bold shadow-md text-sm sm:text-base"
              >
                Passer la commande
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && showTablePrompt && !showSuccessMessage && (
        <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[450px] bg-white rounded-2xl shadow-2xl p-4 sm:p-6 z-50 border border-gray-200">
          <button
            onClick={() => setShowTablePrompt(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Retour"
          >
            <X size={20} />
          </button>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Numéro de table</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">Veuillez entrer votre numéro de table pour finaliser la commande</p>
          <input
            type="number"
            min="1"
            value={tableNumber || ''}
            onChange={(e) => setTableNumber(Number(e.target.value))}
            placeholder="Numéro de table"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 text-base sm:text-lg"
            autoFocus
          />
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm sm:text-base text-gray-700 font-medium">Total de la commande:</span>
              <span className="text-lg sm:text-xl font-bold text-orange-600">{cartTotal.toFixed(0)} HTG</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">{cartItemCount} article{cartItemCount > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={!tableNumber || tableNumber <= 0}
            className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed font-bold shadow-md text-sm sm:text-base"
          >
            Confirmer la commande
          </button>
        </div>
      )}

      {isOpen && showSuccessMessage && (
        <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[450px] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 z-50 border-2 border-green-500">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Commande confirmée !</h3>
            <p className="text-gray-600 text-base sm:text-lg mb-2">
              Votre commande pour la table {tableNumber} a été envoyée au Bar.
            </p>
            <p className="text-gray-500 text-sm sm:text-base">
              Nous préparons votre commande avec soin.
            </p>
            <div className="mt-6">
              <div className="animate-pulse flex justify-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animation-delay-200"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animation-delay-400"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VirtualAssistant;
