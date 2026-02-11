import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  posService,
  OrderResponse,
  OrderStatus,
  PaymentMethod,
} from '@/services/posService';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  UtensilsCrossed,
} from 'lucide-react';

// ==================== CONSTANTS ====================

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  PENDING: {
    label: 'Ready',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: Clock,
  },
  IN_PROCESS: {
    label: 'In Process',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: ChefHat,
  },
  READY: {
    label: 'Ready',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: UtensilsCrossed,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
};

const STATUS_DROPDOWN_OPTIONS: { value: OrderStatus; label: string; dotColor: string }[] = [
  { value: 'PENDING', label: 'Ready to serve', dotColor: 'bg-green-500' },
  { value: 'IN_PROCESS', label: 'Cooking Now', dotColor: 'bg-yellow-500' },
  { value: 'READY', label: 'Ready to serve', dotColor: 'bg-blue-500' },
  { value: 'COMPLETED', label: 'Completed', dotColor: 'bg-gray-500' },
];


const OrderCard = ({
  order,
  index,
  onStatusChange,
  onPayBill,
  onDelete,
}: {
  order: OrderResponse;
  index: number;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onPayBill: (order: OrderResponse) => void;
  onDelete: (id: number) => void;
}) => {
  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card className="relative border border-purple-100/50 bg-purple-50/60 shadow-lg overflow-hidden rounded-xl transition-all duration-500 ring-1 ring-slate-900/5 shadow-[#7c3176]/5">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
      <div className="h-1 w-full bg-gradient-to-r from-[#7c3176] via-[#9b4d94] to-[#7c3176] opacity-80" />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm border-b border-purple-100/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#7c3176] text-white flex items-center justify-center text-lg font-bold">
            {String(index + 1).padStart(2, '0')}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{order.customerName || 'Guest'}</p>
            <p className="text-sm text-gray-500">Order # {order.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'gap-1',
              statusConfig.bgColor,
              statusConfig.color,
              'border-0'
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
          <Select
            value={order.status}
            onValueChange={(value) => onStatusChange(order.id, value as OrderStatus)}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_DROPDOWN_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', option.dotColor)} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date/Time */}
      <div className="relative flex justify-between px-4 py-2 text-xs font-semibold text-slate-500 bg-white/10 backdrop-blur-sm border-b border-purple-100/20">
        <span>{formatDate(order.createdAt)}</span>
        <span>{formatTime(order.createdAt)}</span>
      </div>

      {/* Items - Only show items that should go to kitchen */}
      <CardContent className="p-4">
        <div className="grid grid-cols-[40px_1fr_60px] gap-2 text-sm font-medium text-gray-500 mb-2">
          <span>Qty</span>
          <span>Items (Kitchen Only)</span>
          <span className="text-right">Price</span>
        </div>
        <div className="space-y-2">
          {order.items
            .filter((item) => item.sendToKitchen !== false)
            .map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[40px_1fr_60px] gap-2 text-sm"
              >
                <span className="text-gray-600">
                  {String(item.quantity).padStart(2, '0')}
                </span>
                <span className="text-gray-800">{item.recipeName}</span>
                <span className="text-right text-gray-800">
                  ${item.itemTotal.toFixed(0)}
                </span>
              </div>
            ))}
          {order.items.filter((item) => item.sendToKitchen !== false).length === 0 && (
            <div className="text-center py-2 text-gray-400 text-sm">
              No kitchen items - Ready to serve
            </div>
          )}
        </div>

        {/* SubTotal - Kitchen items only */}
        <div className="flex justify-between mt-4 pt-2 border-t border-purple-100/50 font-bold text-slate-700">
          <span>Kitchen SubTotal</span>
          <span>
            ${order.items
              .filter((item) => item.sendToKitchen !== false)
              .reduce((sum, item) => sum + item.itemTotal, 0)
              .toFixed(0)}
          </span>
        </div>
      </CardContent>

      {/* Actions */}
      <div className="relative flex gap-2 p-4 bg-white/20 backdrop-blur-sm border-t border-purple-100/20">
        <Button
          variant="outline"
          size="icon"
          className="flex-shrink-0"
          onClick={() => { }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(order.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          className="flex-1 bg-[#7c3176] hover:bg-[#7c3176]/90"
          onClick={() => onPayBill(order)}
        >
          Pay Bill
        </Button>
      </div>
    </Card>
  );
};


const Numpad = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const handleClick = (key: string) => {
    if (key === 'x') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + '.');
      }
    } else {
      onChange(value + key);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'x'];

  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key) => (
        <Button
          key={key}
          variant="outline"
          size="lg"
          onClick={() => handleClick(key)}
          className={cn(
            'h-14 text-xl font-medium',
            key === 'x' && 'text-red-500'
          )}
        >
          {key === 'x' ? '⌫' : key}
        </Button>
      ))}
    </div>
  );
};

const OrdersPage = () => {
  const queryClient = useQueryClient();


  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tipAmount, setTipAmount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['pos-orders'],
    queryFn: posService.getAllOrders,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Filter orders based on tab
  const filteredOrders = orders.filter((order) => {
    // Filter by status
    if (activeTab !== 'all') {
      const statusMap: Record<string, OrderStatus[]> = {
        'in-process': ['PENDING', 'IN_PROCESS'],
        completed: ['COMPLETED'],
        cancelled: ['CANCELLED'],
      };
      const allowedStatuses = statusMap[activeTab];
      if (allowedStatuses && !allowedStatuses.includes(order.status)) {
        return false;
      }
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        order.customerName?.toLowerCase().includes(term) ||
        order.id.toString().includes(term) ||
        order.tableNumber.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      posService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
      toast.success('Order status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  // Complete payment mutation
  const completePaymentMutation = useMutation({
    mutationFn: ({
      id,
      paymentMethod,
      tip,
    }: {
      id: number;
      paymentMethod: PaymentMethod;
      tip?: number;
    }) => posService.completePayment(id, paymentMethod, undefined, tip),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
      toast.success('Payment completed');
      setPaymentModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete payment');
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (id: number) => posService.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
      toast.success('Order cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel order');
    },
  });

  // Handlers
  const handleStatusChange = (id: number, status: OrderStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handlePayBill = (order: OrderResponse) => {
    setSelectedOrder(order);
    setTipAmount('0');
    setSelectedPaymentMethod(null);
    setPaymentModalOpen(true);
  };

  const handleCompletePayment = async () => {
    if (!selectedOrder || !selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsSubmitting(true);
    try {
      await completePaymentMutation.mutateAsync({
        id: selectedOrder.id,
        paymentMethod: selectedPaymentMethod,
        tip: Number(tipAmount) || 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between bg-purple-50/60 p-4 rounded-xl border border-purple-100/50">
          <Skeleton className="h-10 w-[300px] rounded-lg" />
          <Skeleton className="h-10 w-[200px] rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skel-${i}`} className="rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-6 w-[80px] rounded-full" />
              </div>
              <Skeleton className="h-4 w-[150px]" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[80%]" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-[70px]" />
                <Skeleton className="h-9 w-[100px] rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-transparent space-y-4">
      {/* Header */}
      <div className="relative flex items-center justify-between bg-purple-50/60 backdrop-blur-md p-4 rounded-xl border border-purple-100/50 shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />

        <Tabs value={activeTab} className="relative" onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100/50 backdrop-blur-sm border border-slate-200/50">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-white data-[state=active]:text-[#7c3176] text-slate-600 font-bold"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="in-process"
              className="data-[state=active]:bg-white data-[state=active]:text-[#7c3176] text-slate-600 font-bold"
            >
              In Process
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-white data-[state=active]:text-[#7c3176] text-slate-600 font-bold"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="data-[state=active]:bg-white data-[state=active]:text-[#7c3176] text-slate-600 font-bold"
            >
              Cancelled
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex items-center gap-3">
          <Button className="bg-[#7c3176] hover:bg-[#7c3176]/90 shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Add New Order
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
            <Input
              placeholder="Search a name, oder or etc"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/60 backdrop-blur-sm border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#7c3176]/20 transition-all rounded-lg pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
          {filteredOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              index={index}
              onStatusChange={handleStatusChange}
              onPayBill={handlePayBill}
              onDelete={handleDelete}
            />
          ))}
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">No orders found</div>
        )}
      </ScrollArea>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {selectedOrder?.tableNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-[#7c3176] text-white border-0"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </Badge>
                      {item.recipeName} x {item.quantity}
                    </span>
                    <span>${item.itemTotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax {(selectedOrder.taxRate * 100).toFixed(0)}%</span>
                    <span>${selectedOrder.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span>${Number(tipAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>
                      ${(
                        selectedOrder.totalAmount + Number(tipAmount)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tips Amount */}
              <div>
                <p className="text-sm font-medium mb-2">Tips Amount</p>
                <Input
                  value={tipAmount}
                  onChange={(e) =>
                    setTipAmount(e.target.value.replace(/[^0-9.]/g, ''))
                  }
                  className="text-2xl font-bold text-center h-14"
                  placeholder="0.00"
                />
              </div>

              {/* Numpad */}
              <Numpad value={tipAmount} onChange={setTipAmount} />

              {/* Payment Methods */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={
                      selectedPaymentMethod === 'CASH' ? 'default' : 'outline'
                    }
                    className={cn(
                      'h-16 flex-col',
                      selectedPaymentMethod === 'CASH' &&
                      'bg-[#7c3176] hover:bg-[#7c3176]/90'
                    )}
                    onClick={() => setSelectedPaymentMethod('CASH')}
                  >
                    <Banknote className="h-5 w-5 mb-1" />
                    <span className="text-xs">Cash</span>
                  </Button>
                  <Button
                    variant={
                      selectedPaymentMethod === 'DEBIT_CARD'
                        ? 'default'
                        : 'outline'
                    }
                    className={cn(
                      'h-16 flex-col',
                      selectedPaymentMethod === 'DEBIT_CARD' &&
                      'bg-[#7c3176] hover:bg-[#7c3176]/90'
                    )}
                    onClick={() => setSelectedPaymentMethod('DEBIT_CARD')}
                  >
                    <CreditCard className="h-5 w-5 mb-1" />
                    <span className="text-xs">Debit Card</span>
                  </Button>
                  <Button
                    variant={
                      selectedPaymentMethod === 'E_WALLET'
                        ? 'default'
                        : 'outline'
                    }
                    className={cn(
                      'h-16 flex-col',
                      selectedPaymentMethod === 'E_WALLET' &&
                      'bg-[#7c3176] hover:bg-[#7c3176]/90'
                    )}
                    onClick={() => setSelectedPaymentMethod('E_WALLET')}
                  >
                    <Wallet className="h-5 w-5 mb-1" />
                    <span className="text-xs">E-Wallet</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPaymentModalOpen(false);

              }}
            >
              Print Receipt
            </Button>
            <Button
              className="bg-[#7c3176] hover:bg-[#7c3176]/90"
              onClick={handleCompletePayment}
              disabled={!selectedPaymentMethod || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Order Completed'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
