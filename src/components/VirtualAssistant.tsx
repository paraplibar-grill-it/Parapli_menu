import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useMenu } from '../context/MenuContext';
import { createOrder } from '../services/orderService';
import type { MenuItem, Category } from '../types';
import { toast } from 'react-hot-toast';

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface MenuView {
  type: 'categories' | 'items';
  categoryId?: string;
}

const VirtualAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [showTablePrompt, setShowTablePrompt] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState<MenuView>({ type: 'categories' });
  const [searchQuery, setSearchQuery] = useState('');
  const { menuItems, categories } = useMenu();


  const filteredItems = menuItems.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = currentView.type === 'categories' ||
      item.category_id === currentView.categoryId;

    return matchesSearch && matchesCategory;
  });

  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.find(c => c.id === categoryId);
  };

  const handleTableNumberSubmit = () => {
    if (tableNumber && tableNumber > 0) {
      setShowTablePrompt(false);
      setCurrentView({ type: 'categories' });
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { item, quantity: 1 }];
    });
    toast.success(`${item.name} ajouté au panier !`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(cartItem =>
        cartItem.item.id === itemId ? { ...cartItem, quantity } : cartItem
      )
    );
  };

  const handlePlaceOrder = async () => {
    if (!tableNumber || cart.length === 0) return;

    try {
      const orderItems = cart.map(({ item, quantity }) => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity
      }));

      await createOrder(tableNumber, orderItems);
      toast.success(`Commande passée avec succès ! Nous préparons votre commande pour la table ${tableNumber}.`);
      setCart([]);
      setCurrentView({ type: 'categories' });
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Erreur lors de la commande. Veuillez réessayer.');
    }
  };

  const cartTotal = cart.reduce((sum, { item, quantity }) => sum + (item.price * quantity), 0);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Commander"
      >
        <ShoppingCart size={28} />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </button>

      {isOpen && showTablePrompt && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl p-6 z-50 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Bienvenue !</h3>
          <p className="text-gray-600 mb-4">Veuillez entrer votre numéro de table pour commencer</p>
          <input
            type="number"
            min="1"
            value={tableNumber || ''}
            onChange={(e) => setTableNumber(Number(e.target.value))}
            placeholder="Numéro de table"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleTableNumberSubmit}
              disabled={!tableNumber || tableNumber <= 0}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {isOpen && !showTablePrompt && (
        <div className="fixed bottom-6 right-6 w-[450px] h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart size={24} />
              <div>
                <h3 className="font-bold text-lg">Commander</h3>
                <p className="text-xs text-orange-100">Table {tableNumber}</p>
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

          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {currentView.type === 'categories' && (
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Choisissez une catégorie</h4>
              <div className="grid grid-cols-2 gap-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setCurrentView({ type: 'items', categoryId: category.id })}
                    className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4 hover:shadow-lg hover:border-orange-400 transition-all text-left"
                  >
                    <h5 className="font-bold text-gray-800 text-lg">{category.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {menuItems.filter(item => item.category_id === category.id).length} articles
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentView.type === 'items' && (
            <>
              <div className="p-4 border-b border-gray-200 bg-orange-50">
                <button
                  onClick={() => setCurrentView({ type: 'categories' })}
                  className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
                >
                  ← Retour aux catégories
                </button>
                <h4 className="text-lg font-bold text-gray-800 mt-2">
                  {getCategoryById(currentView.categoryId!)?.name}
                </h4>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredItems.length === 0 ? (
                  <p className="text-center text-gray-500 mt-8">Aucun article trouvé</p>
                ) : (
                  filteredItems.map(item => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <h5 className="font-bold text-gray-800">{item.name}</h5>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                          <p className="text-lg font-bold text-orange-600 mt-2">{item.price} HTG</p>
                        </div>
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {cart.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="mb-3">
                <h5 className="font-bold text-gray-800 mb-2">Panier ({cart.length})</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-2 text-sm">
                      <span className="flex-1 truncate">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, quantity - 1)}
                          className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-semibold">{quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, quantity + 1)}
                          className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-800">Total:</span>
                <span className="text-xl font-bold text-orange-600">{cartTotal} HTG</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-bold"
              >
                Passer la commande
              </button>
            </div>
          )}
        </div>
      )}

    </>
  );
};

export default VirtualAssistant;
