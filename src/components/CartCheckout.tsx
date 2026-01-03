import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orderService';
import { ShoppingBag, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CartCheckoutProps {
  onBack: () => void;
}

const CartCheckout: React.FC<CartCheckoutProps> = ({ onBack }) => {
  const { cart, cartTotal, clearCart } = useCart();
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tableNumber.trim()) {
      toast.error('Veuillez entrer le numéro de table');
      return;
    }

    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setLoading(true);

    try {
      const items = cart.map(({ item, quantity }) => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity
      }));

      await createOrder(
        parseInt(tableNumber),
        items,
        customerName || undefined,
        notes || undefined
      );

      clearCart();
      setOrderPlaced(true);
      toast.success('Commande passée avec succès !', { duration: 3000 });

      setTimeout(() => {
        onBack();
        setOrderPlaced(false);
      }, 3000);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Erreur lors de la passage de la commande');
      setLoading(false);
    }
  };


  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2]">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <Check size={48} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Commande passée !</h2>
          <p className="text-gray-600 mb-4">Votre commande a été confirmée. Un serveur vous apportera votre commande bientôt.</p>
          <div className="inline-block px-6 py-2 bg-primary/10 text-primary rounded-lg font-semibold">
            Table {tableNumber}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] py-8">
      <div className="container mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour au menu</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBag size={24} className="text-primary" />
                <h1 className="text-3xl font-bold text-primary">Votre Panier</h1>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantité: {quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">G{(item.price * quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">G{item.price.toFixed(2)} x {quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handlePlaceOrder} className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-primary mb-6">Informations de la commande</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Numéro de table *
                  </label>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: 5"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Votre nom (optionnel)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Jean Dupont"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remarques spéciales (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Sans glaçons, peu de sauce..."
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none resize-none"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="pt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    L'équipe de Parapli Bar a été notifiée de votre commande et la prépare. Un serveur vous apportera votre commande dès qu'elle sera prête.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Passage de la commande...' : 'Passer la commande'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-primary mb-6">Résumé</h3>

              <div className="space-y-4 pb-6 border-b-2 border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Articles ({cart.length})</span>
                  <span className="font-semibold text-gray-800">G{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Taxes</span>
                  <span className="font-semibold text-gray-800">G0.00</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>Total</span>
                  <span>G{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-gray-700">
                  Paiement à la table disponible en espèces, carte bancaire, ou autres méthodes de paiement acceptées.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartCheckout;
