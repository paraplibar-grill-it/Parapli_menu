import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, Trash2, ChefHat, Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { getOrders, updateOrderStatus, deleteOrder, subscribeToOrders, markOrderAsRead } from '../services/orderService';
import type { OrderWithItems } from '../types';
import { toast } from 'react-hot-toast';
import { playNotificationSound, stopNotificationSound, isNotificationPlaying, initAudioContext } from '../utils/notificationSound';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTable, setSearchTable] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'table' | 'amount'>('date');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const previousOrdersRef = useRef<string[]>([]);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const initializeOrders = async () => {
      try {
        await initAudioContext();
        await fetchOrders();

        if (!mounted) return;

        const unsubscribe = subscribeToOrders((event: string) => {
          if (!mounted) return;

          console.log('Order change event:', event);

          if (event === 'INSERT') {
            console.log('New order detected, soundEnabled:', soundEnabledRef.current);

            if (soundEnabledRef.current) {
              console.log('Attempting to play sound...');
              playNotificationSound()
                .then(() => {
                  console.log('Sound played successfully');
                  toast.success('Nouvelle commande reçue !', {
                    duration: 5000,
                  });
                })
                .catch(err => {
                  console.error('Sound play error:', err);
                  toast.success('Nouvelle commande reçue !', {
                    duration: 5000,
                  });
                });
            } else {
              console.log('Sound disabled, skipping sound');
              toast.success('Nouvelle commande reçue !', {
                duration: 5000,
              });
            }

            fetchOrders();
          } else if (event === 'UPDATE' || event === 'DELETE') {
            fetchOrders();
          }
        });

        pollInterval = setInterval(() => {
          if (mounted) {
            fetchOrders();
          }
        }, 3000);

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing orders:', error);
      }
    };

    const unsubPromise = initializeOrders();

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
      unsubPromise?.then(unsub => unsub?.());
      stopNotificationSound();
    };
  }, []);

  useEffect(() => {
    const unreadOrders = orders.filter(order => !order.is_read);

    // Stop sound if all orders are read
    if (unreadOrders.length === 0 && isNotificationPlaying()) {
      stopNotificationSound();
    }
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled') => {
    try {
      // Optimistic update
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status, is_read: true }
            : order
        )
      );

      await updateOrderStatus(orderId, status);
      await markOrderAsRead(orderId);

      toast.success('Statut mis à jour');

      // Fetch fresh data from server
      await fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
      // Revert on error
      await fetchOrders();
    }
  };

  const handleMarkAsRead = async (orderId: string) => {
    try {
      // Optimistic update
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, is_read: true }
            : order
        )
      );

      await markOrderAsRead(orderId);

      // Check if there are any unread orders left
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, is_read: true } : order
      );
      const remainingUnread = updatedOrders.filter(order => !order.is_read);

      if (remainingUnread.length === 0) {
        stopNotificationSound();
      }

      // Fetch fresh data from server
      await fetchOrders();
    } catch (error) {
      console.error('Error marking order as read:', error);
      toast.error('Erreur lors du marquage');
      await fetchOrders();
    }
  };

  const toggleSound = async () => {
    if (soundEnabled) {
      stopNotificationSound();
      setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      await initAudioContext();
      toast.success('Alertes sonores activées', { duration: 2000 });
    }
  };

  const testSound = async () => {
    try {
      console.log('Starting sound test...');
      await initAudioContext();
      console.log('AudioContext initialized');

      stopNotificationSound();
      console.log('Previous sound stopped');

      console.log('Playing test notification sound...');
      await playNotificationSound();

      toast.success('Test de son - écoutez les bips', {
        duration: 6000,
      });

      setTimeout(() => {
        console.log('Stopping test sound');
        stopNotificationSound();
      }, 5000);
    } catch (error) {
      console.error('Error testing sound:', error);
      toast.error('Erreur lors du test du son: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;

    try {
      await deleteOrder(orderId);
      toast.success('Commande supprimée');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  let filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  if (searchTable) {
    filteredOrders = filteredOrders.filter(order =>
      order.table_number.toString().includes(searchTable) ||
      order.customer_name?.toLowerCase().includes(searchTable.toLowerCase())
    );
  }

  filteredOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'table':
        return a.table_number - b.table_number;
      case 'amount':
        return b.total_amount - a.total_amount;
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'preparing': return <ChefHat size={16} />;
      case 'ready': return <Bell size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prêt';
      case 'delivered': return 'Livré';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const ordersByStatus = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const unreadCount = orders.filter(o => !o.is_read).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Gestion des Commandes</h1>
          <p className="text-gray-600">Gérez toutes les commandes clients en temps réel</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <div className="bg-red-100 border-2 border-red-500 rounded-lg px-4 py-2 flex items-center gap-2 animate-pulse">
              <Bell className="text-red-600" size={20} />
              <span className="font-bold text-red-600">{unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} commande{unreadCount > 1 ? 's' : ''}</span>
            </div>
          )}
          <button
            onClick={testSound}
            className="px-4 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-all font-medium flex items-center gap-2"
            title="Tester le son"
          >
            <Bell size={18} />
            Test son
          </button>
          <button
            onClick={toggleSound}
            className={`p-3 rounded-lg transition-all ${
              soundEnabled
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={soundEnabled ? 'Désactiver les alertes sonores' : 'Activer les alertes sonores'}
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">En attente</p>
              <p className="text-3xl font-bold text-yellow-800">{ordersByStatus.pending}</p>
            </div>
            <Clock size={32} className="text-yellow-600" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">En préparation</p>
              <p className="text-3xl font-bold text-blue-800">{ordersByStatus.preparing}</p>
            </div>
            <ChefHat size={32} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Prêt</p>
              <p className="text-3xl font-bold text-green-800">{ordersByStatus.ready}</p>
            </div>
            <Bell size={32} className="text-green-600" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Livrés</p>
              <p className="text-3xl font-bold text-gray-800">{ordersByStatus.delivered}</p>
            </div>
            <CheckCircle size={32} className="text-gray-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Rechercher par table ou nom..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'table' | 'amount')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Trier par date</option>
              <option value="table">Trier par table</option>
              <option value="amount">Trier par montant</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente ({ordersByStatus.pending})
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'preparing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En préparation ({ordersByStatus.preparing})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'ready'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Prêt ({ordersByStatus.ready})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'delivered'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Livrés ({ordersByStatus.delivered})
          </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">Aucune commande trouvée</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow relative ${!order.is_read ? 'border-4 border-red-400' : ''}`}>
              {!order.is_read && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce flex items-center gap-1">
                  <Bell size={14} />
                  NOUVEAU
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-800 font-bold text-xl rounded-lg px-4 py-2">
                    Table {order.table_number}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('fr-FR')}
                    </p>
                    {order.customer_name && (
                      <p className="text-sm text-gray-700 font-medium">{order.customer_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!order.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(order.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
                    >
                      <CheckCircle size={16} />
                      Marquer comme lu
                    </button>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </span>
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Articles commandés:</h3>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded text-sm">
                          x{item.quantity}
                        </span>
                        <span className="text-gray-800">{item.item_name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        {(item.price_at_order * item.quantity).toFixed(0)} HTG
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {order.notes && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Note: </span>
                    {order.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-xl font-bold text-gray-800">
                  Total: {order.total_amount} HTG
                </div>
                <div className="flex gap-2">
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => {
                          const nextStatus =
                            order.status === 'pending' ? 'preparing' :
                            order.status === 'preparing' ? 'ready' :
                            'delivered';
                          handleStatusUpdate(order.id, nextStatus);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-md font-semibold flex items-center gap-2"
                      >
                        {order.status === 'pending' && (
                          <>
                            <ChefHat size={18} />
                            Commencer
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <>
                            <Bell size={18} />
                            Prêt
                          </>
                        )}
                        {order.status === 'ready' && (
                          <>
                            <CheckCircle size={18} />
                            Livré
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <XCircle size={18} />
                        Annuler
                      </button>
                    </>
                  )}
                  {order.status === 'delivered' && (
                    <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold flex items-center gap-2">
                      <CheckCircle size={18} />
                      Commande livrée
                    </div>
                  )}
                  {order.status === 'cancelled' && (
                    <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold flex items-center gap-2">
                      <XCircle size={18} />
                      Commande annulée
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
