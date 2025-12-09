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
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">Gestion des Commandes</h1>
          <p className="text-sm md:text-base text-gray-600">Gérez toutes les commandes clients en temps réel</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap">
          {unreadCount > 0 && (
            <div className="bg-red-100 border-2 border-red-500 rounded-lg px-2 md:px-4 py-2 flex items-center gap-2 animate-pulse text-xs md:text-sm">
              <Bell className="text-red-600 flex-shrink-0" size={16} />
              <span className="font-bold text-red-600 whitespace-nowrap">{unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}</span>
            </div>
          )}
          <button
            onClick={testSound}
            className="px-2 md:px-4 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-all font-medium flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            title="Tester le son"
          >
            <Bell size={16} />
            <span className="hidden sm:inline">Test son</span>
          </button>
          <button
            onClick={toggleSound}
            className={`p-2 md:p-3 rounded-lg transition-all ${
              soundEnabled
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={soundEnabled ? 'Désactiver les alertes sonores' : 'Activer les alertes sonores'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg md:rounded-xl p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-yellow-600 font-medium">En attente</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-800">{ordersByStatus.pending}</p>
            </div>
            <Clock size={24} className="text-yellow-600 flex-shrink-0 hidden md:block" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg md:rounded-xl p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-blue-600 font-medium">En préparation</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-800">{ordersByStatus.preparing}</p>
            </div>
            <ChefHat size={24} className="text-blue-600 flex-shrink-0 hidden md:block" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg md:rounded-xl p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-green-600 font-medium">Prêt</p>
              <p className="text-2xl md:text-3xl font-bold text-green-800">{ordersByStatus.ready}</p>
            </div>
            <Bell size={24} className="text-green-600 flex-shrink-0 hidden md:block" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-gray-600 font-medium">Livrés</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{ordersByStatus.delivered}</p>
            </div>
            <CheckCircle size={24} className="text-gray-600 flex-shrink-0 hidden md:block" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              type="text"
              placeholder="Rechercher par table ou nom..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'table' | 'amount')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="date">Trier par date</option>
              <option value="table">Trier par table</option>
              <option value="amount">Trier par montant</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({orders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente ({ordersByStatus.pending})
            </button>
            <button
              onClick={() => setFilter('preparing')}
              className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                filter === 'preparing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En préparation ({ordersByStatus.preparing})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                filter === 'ready'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Prêt ({ordersByStatus.ready})
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
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
            <div key={order.id} className={`bg-white rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-shadow relative overflow-hidden ${!order.is_read ? 'border-4 border-red-400' : ''}`}>
              {!order.is_read && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white px-2 md:px-3 py-1 rounded-full text-xs font-bold animate-bounce flex items-center gap-1 z-10">
                  <Bell size={12} />
                  NOUVEAU
                </div>
              )}
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="bg-blue-100 text-blue-800 font-bold text-lg md:text-xl rounded-lg px-3 md:px-4 py-2 flex-shrink-0">
                      T{order.table_number}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        {new Date(order.created_at).toLocaleString('fr-FR')}
                      </p>
                      {order.customer_name && (
                        <p className="text-xs md:text-sm text-gray-700 font-medium truncate">{order.customer_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-end">
                    {!order.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(order.id)}
                        className="px-2 md:px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs md:text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                      >
                        <CheckCircle size={14} />
                        <span className="hidden sm:inline">Marquer comme lu</span>
                        <span className="inline sm:hidden">Lire</span>
                      </button>
                    )}
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium border flex items-center gap-1 whitespace-nowrap ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="hidden xs:inline">{getStatusLabel(order.status)}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-1 md:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-sm md:text-base text-gray-800 mb-2">Articles:</h3>
                  <div className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-start bg-gray-50 rounded-lg p-2 md:p-3 gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded text-xs flex-shrink-0">
                            x{item.quantity}
                          </span>
                          <span className="text-xs md:text-sm text-gray-800 line-clamp-2">{item.item_name}</span>
                        </div>
                        <span className="font-semibold text-xs md:text-sm text-gray-800 flex-shrink-0 whitespace-nowrap">
                          {(item.price_at_order * item.quantity).toFixed(0)} HTG
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-3">
                    <p className="text-xs md:text-sm text-yellow-800">
                      <span className="font-semibold">Note: </span>
                      {order.notes}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="text-lg md:text-xl font-bold text-gray-800 order-2 sm:order-1">
                    Total: {order.total_amount} HTG
                  </div>
                  <div className="flex gap-2 flex-wrap order-1 sm:order-2 justify-end">
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
                          className="px-3 md:px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-md font-semibold flex items-center gap-1 md:gap-2 text-xs md:text-sm whitespace-nowrap"
                        >
                          {order.status === 'pending' && (
                            <>
                              <ChefHat size={16} />
                              <span className="hidden sm:inline">Commencer</span>
                              <span className="inline sm:hidden">Go</span>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <>
                              <Bell size={16} />
                              Prêt
                            </>
                          )}
                          {order.status === 'ready' && (
                            <>
                              <CheckCircle size={16} />
                              Livré
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          className="px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                        >
                          <XCircle size={16} />
                          <span className="hidden sm:inline">Annuler</span>
                        </button>
                      </>
                    )}
                    {order.status === 'delivered' && (
                      <div className="px-3 md:px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                        <CheckCircle size={16} />
                        <span className="hidden sm:inline">Commande livrée</span>
                        <span className="inline sm:hidden">Livrée</span>
                      </div>
                    )}
                    {order.status === 'cancelled' && (
                      <div className="px-3 md:px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                        <XCircle size={16} />
                        <span className="hidden sm:inline">Commande annulée</span>
                        <span className="inline sm:hidden">Annulée</span>
                      </div>
                    )}
                  </div>
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
