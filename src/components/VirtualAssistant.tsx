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
        className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Ouvrir le panier"
      >
        <ShoppingCart size={28} />
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
            {cartItemCount}
          </span>
        )}
      </button>

      {isOpen && !showTablePrompt && !showSuccessMessage && (
        <div className="fixed bottom-6 right-6 w-[450px] h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart size={24} />
              <div>
                <h3 className="font-bold text-lg">Votre Panier</h3>
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

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart size={64} className="text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Votre panier est vide</p>
                <p className="text-gray-400 text-sm mt-2">Parcourez le menu et ajoutez des articles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(({ item, quantity }) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h5 className="font-bold text-gray-800">{item.name}</h5>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                        <p className="text-lg font-bold text-orange-600 mt-2">{item.price} HTG</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, quantity - 1)}
                          className="w-8 h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-semibold text-gray-800">{quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, quantity + 1)}
                          className="w-8 h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <span className="font-bold text-gray-800">
                        {(item.price * quantity).toFixed(0)} HTG
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-orange-600">{cartTotal.toFixed(0)} HTG</span>
              </div>
              <button
                onClick={handleProceedToOrder}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-bold shadow-md"
              >
                Passer la commande
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && showTablePrompt && !showSuccessMessage && (
        <div className="fixed bottom-6 right-6 w-[450px] bg-white rounded-2xl shadow-2xl p-6 z-50 border border-gray-200">
          <button
            onClick={() => setShowTablePrompt(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Retour"
          >
            <X size={20} />
          </button>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Numéro de table</h3>
          <p className="text-gray-600 mb-4">Veuillez entrer votre numéro de table pour finaliser la commande</p>
          <input
            type="number"
            min="1"
            value={tableNumber || ''}
            onChange={(e) => setTableNumber(Number(e.target.value))}
            placeholder="Numéro de table"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 text-lg"
            autoFocus
          />
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Total de la commande:</span>
              <span className="text-xl font-bold text-orange-600">{cartTotal.toFixed(0)} HTG</span>
            </div>
            <p className="text-sm text-gray-600">{cartItemCount} article{cartItemCount > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={!tableNumber || tableNumber <= 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed font-bold shadow-md"
          >
            Confirmer la commande
          </button>
        </div>
      )}

      {isOpen && showSuccessMessage && (
        <div className="fixed bottom-6 right-6 w-[450px] bg-white rounded-2xl shadow-2xl p-8 z-50 border-2 border-green-500">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Commande confirmée !</h3>
            <p className="text-gray-600 text-lg mb-2">
              Votre commande pour la table {tableNumber} a été envoyée à la cuisine.
            </p>
            <p className="text-gray-500 text-sm">
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
