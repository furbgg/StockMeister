import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  posService,
  MenuProduct,
  OrderRequest,
  PaymentMethod,
  getImageUrl,
} from '@/services/posService';
import { useCartStore, CartItem } from '@/stores/useCartStore';
import { cn } from '@/lib/utils';
import {
  Plus,
  Minus,
  Search,
  Loader2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Wallet,

  Pencil,
  X,
  User,
  ChefHat,
  ReceiptEuro,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';



const TAX_RATE = 0.05; // 5%

const CATEGORY_ICONS: Record<string, string> = {
  'Hauptspeise': '🍽️',
  'Nachspeise': '🍰',
  'Getränke': '🥤',
  'Salat': '🥗',
  'Vorspeise': '🥣',
  'Beilage': '🍟',
  'Suppe': '🍲',
  'General': '📦',
  'default': '🍽️',
};


interface CategoryProduct {
  category: string;
  products: MenuProduct[];
  icon: string;
}


const groupByCategory = (products: MenuProduct[]): CategoryProduct[] => {
  const categoryMap = new Map<string, MenuProduct[]>();

  products.forEach((product) => {

    const categoryName = product.category?.trim() || 'General';
    const existing = categoryMap.get(categoryName) || [];
    categoryMap.set(categoryName, [...existing, product]);
  });

  return Array.from(categoryMap.entries())
    .map(([category, products]) => ({
      category,
      products,
      icon: CATEGORY_ICONS[category] || CATEGORY_ICONS.default,
    }))

    .sort((a, b) => a.category.localeCompare(b.category));
};


const ProductCard = ({
  product,
  onAddToCart,
}: {
  product: MenuProduct;
  onAddToCart: () => void;
}) => {
  const { t } = useTranslation();
  const imageUrl = getImageUrl(product.imagePath);

  return (
    <div
      className="group relative bg-purple-50/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-purple-900/10 transition-all duration-500 cursor-pointer border border-purple-100/50 hover:border-purple-300/50 flex flex-col h-full"
      onClick={onAddToCart}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-purple-100/20 pointer-events-none" />
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-4xl">
            🍽️
          </div>
        )}
        <div className="hidden w-full h-full absolute inset-0 flex items-center justify-center bg-slate-50 text-4xl">
          🍽️
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type Badge */}
        <div className="absolute top-3 right-3 shadow-lg">
          {product.sendToKitchen ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full shadow-sm">
              <ChefHat className="w-3 h-3" /> {t('pos.kitchen')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full shadow-sm">
              <User className="w-3 h-3" /> Bar
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3 relative z-10">
        <h3 className="font-bold text-slate-700 line-clamp-2 text-sm leading-snug min-h-[2.5rem] group-hover:text-[#16213e] transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-purple-100/10">
          <span className="font-extrabold text-[#16213e] text-lg">
            €{Number(product.sellingPrice).toFixed(2)}
          </span>
          <div className="h-8 w-8 rounded-full bg-[#16213e] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-md hover:bg-[#1c2b50]">
            <Plus className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItemRow = ({
  item,

  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: CartItem;

  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="group relative flex items-center gap-3 py-3 px-3 bg-purple-50/60 backdrop-blur-md hover:bg-white/80 rounded-xl border border-purple-100/40 hover:border-purple-200/50 transition-all mb-2 shadow-sm hover:shadow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-purple-100/10 pointer-events-none" />
      <div className="relative z-10 w-8 h-8 rounded-full bg-white shadow-sm text-[#7c3176] flex items-center justify-center text-xs font-bold shrink-0">
        {item.quantity}x
      </div>
      <div className="relative z-10 flex-1 min-w-0">
        <p className="font-bold text-slate-700 text-sm truncate">{item.recipeName}</p>
        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
          <span>€{item.unitPrice.toFixed(2)} {t('pos.unit')}</span>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-2">
        <p className="font-bold text-[#7c3176] text-sm mr-2 w-16 text-right">
          €{(item.unitPrice * item.quantity).toFixed(2)}
        </p>

        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDecrease}
            className="h-6 w-6 rounded-full border border-slate-200 text-slate-400 hover:text-[#16213e] hover:border-[#16213e] bg-white"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onIncrease}
            className="h-6 w-6 rounded-full border border-slate-200 text-slate-400 hover:text-[#16213e] hover:border-[#16213e] bg-white"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
            className="h-6 w-6 ml-1 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
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

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.'];

  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((key) => (
        <Button
          key={key}
          variant="outline"
          onClick={() => handleClick(key)}
          className="h-14 text-xl font-medium rounded-xl border-slate-200 text-slate-700 hover:border-[#16213e] hover:text-[#16213e]"
        >
          {key}
        </Button>
      ))}
      <Button
        variant="outline"
        onClick={() => handleClick('x')}
        className="h-14 text-xl font-medium rounded-xl border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
      >
        ⌫
      </Button>
    </div>
  );
};



const POSPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Cart store
  const {
    items: cartItems,
    tableNumber,
    customerName,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setTableNumber,
    setCustomerName,
    getSubtotal,
    getTaxAmount,
    getTotal,
  } = useCartStore();

  // Local state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tipAmount, setTipAmount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableEditMode, setTableEditMode] = useState(false);

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['pos-products'],
    queryFn: posService.getMenuProducts,
  });

  // Group products by category
  const categories = useMemo(() => groupByCategory(products), [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeCategory !== 'all') {
      const category = categories.find((c) => c.category === activeCategory);
      result = category?.products || [];
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(term));
    }
    return result;
  }, [products, activeCategory, categories, searchTerm]);

  // Pagination
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  useMemo(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderRequest: OrderRequest) => posService.createOrder(orderRequest),
    onSuccess: (order) => {
      toast.success(`Order #${order.id} completed successfully!`);
      clearCart();
      setPaymentModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create order');
    },
  });

  // Handlers
  const handleAddToCart = (product: MenuProduct) => {
    addToCart({
      recipeId: product.id,
      recipeName: product.name,
      recipeImagePath: product.imagePath,
      unitPrice: Number(product.sellingPrice),
    });

  };


  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setTipAmount('0');
    setSelectedPaymentMethod(null);
    setPaymentModalOpen(true);
  };

  // Submits Payment
  const handleCompletePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsSubmitting(true);

    const orderRequest: OrderRequest = {
      tableNumber,
      customerName: customerName || undefined,
      items: cartItems.map((item) => ({
        recipeId: item.recipeId,
        quantity: item.quantity,
        notes: item.notes,
      })),
      paymentMethod: selectedPaymentMethod,
      tip: Number(tipAmount) || 0,
    };

    try {
      await createOrderMutation.mutateAsync(orderRequest);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sends to Kitchen (Unpaid)
  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsSubmitting(true);

    const orderRequest: OrderRequest = {
      tableNumber,
      customerName: customerName || undefined,
      items: cartItems.map((item) => ({
        recipeId: item.recipeId,
        quantity: item.quantity,
        notes: item.notes,
      })),
      paymentMethod: 'UNPAID',
    };

    try {
      const order = await posService.createOrder(orderRequest);
      toast.success(`Order #${order.id} sent to kitchen!`);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['pos-orders'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const subtotal = getSubtotal();
  const taxAmount = getTaxAmount(TAX_RATE);
  const total = getTotal(TAX_RATE);

  const orderPanelContent = (
    <div className="flex flex-col h-full bg-purple-50/40 backdrop-blur-md relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />

      {/* Header */}
      <div className="relative p-5 border-b border-purple-100/30 bg-white/40 backdrop-blur-md z-10 shrink-0 shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-100/50 to-transparent" />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#16213e]/10 text-[#16213e]">
              <ReceiptEuro className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('pos.current_order')}</p>
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setTableEditMode(!tableEditMode)}>
                {tableEditMode ? (
                  <Input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    onBlur={() => setTableEditMode(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setTableEditMode(false)}
                    className="w-24 h-7 text-lg font-bold p-0 border-none focus-visible:ring-0"
                    autoFocus
                  />
                ) : (
                  <h2 className="text-lg font-bold text-slate-800">{tableNumber}</h2>
                )}
                <Pencil className="h-3 w-3 text-slate-300 group-hover:text-[#16213e] transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <Input
            placeholder={t('pos.customer_name')}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="h-9 bg-white/60 backdrop-blur-sm border-slate-200 focus:bg-white transition-all text-sm rounded-lg"
          />
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 px-4 py-4 relative z-10">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-300">
            <div className="p-6 bg-purple-100/30 rounded-full mb-4 backdrop-blur-sm border border-purple-100/20">
              <ShoppingCart className="h-10 w-10 text-purple-300" />
            </div>
            <p className="font-bold text-slate-400">{t('pos.empty_cart_title')}</p>
            <p className="text-sm">{t('pos.empty_cart_desc')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {cartItems.map((item) => (
              <CartItemRow
                key={item.recipeId}
                item={item}

                onIncrease={() => updateQuantity(item.recipeId, item.quantity + 1)}
                onDecrease={() => updateQuantity(item.recipeId, item.quantity - 1)}
                onRemove={() => removeFromCart(item.recipeId)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer - Totals & Actions */}
      <div className="relative p-5 bg-white/60 backdrop-blur-md border-t border-purple-200/30 shadow-[0_-4px_30px_-5px_rgba(124,49,118,0.1)] z-20 shrink-0 space-y-4">
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex justify-between text-slate-500 text-sm">
            <span>{t('pos.subtotal')}</span>
            <span className="font-medium text-slate-700">€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-sm">
            <span>{t('pos.tax')} {(TAX_RATE * 100).toFixed(0)}%</span>
            <span className="font-medium text-slate-700">€{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-end pt-3 border-t border-dashed border-slate-200">
            <span className="font-bold text-slate-800 text-lg">{t('pos.total')}</span>
            <span className="font-extrabold text-[#16213e] text-3xl">€{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 text-sm font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-[#16213e] hover:text-[#16213e] rounded-xl transition-all"
            onClick={handleSendToKitchen}
            disabled={cartItems.length === 0 || isSubmitting}
          >
            <ChefHat className="mr-2 h-5 w-5" />
            {t('pos.kitchen')}
          </Button>

          <Button
            className="h-12 text-sm font-bold bg-[#16213e] hover:bg-[#1c2b50] text-white rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isSubmitting}
          >
            <ReceiptEuro className="mr-2 h-5 w-5" />
            {t('pos.charge')}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#16213e]" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-64px)] flex overflow-hidden">
      {/* LEFT SIDE - Menu Products */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 p-4 lg:p-6 gap-6">

        {/* Top Section with Cinematic Style */}
        <div className="relative rounded-xl bg-purple-50/60 backdrop-blur-md border border-purple-100/50 shadow-sm overflow-hidden ring-1 ring-slate-900/5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
          <div className="h-1 w-full bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-600 opacity-80" />
          <div className="relative p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">

            {/* Category Tabs embedded in header */}
            <ScrollArea className="w-full sm:w-auto sm:flex-1 whitespace-nowrap pb-2 sm:pb-0 text-left min-w-0">
              <div className="flex gap-5 px-1 py-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all border text-sm font-bold whitespace-nowrap',
                    activeCategory === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <span>🍽️</span>
                  <span>{t('pos.all_items')}</span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setActiveCategory(cat.category)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-all border text-sm font-bold whitespace-nowrap',
                      activeCategory === cat.category
                        ? 'bg-[#16213e] text-white border-[#16213e] shadow-md shadow-blue-900/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-200'
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.category}</span>
                    <span className={cn("ml-1 text-[10px] py-0.5 px-1.5 rounded-full", activeCategory === cat.category ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400")}>{cat.products.length}</span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-2.5" />
            </ScrollArea>

            {/* Search & Pagination */}
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <div className="relative w-full sm:w-64 group">
                <Input
                  placeholder={t('pos.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 bg-white/60 backdrop-blur-sm border-slate-200 focus:bg-white focus:ring-1 focus:ring-[#16213e] transition-all rounded-lg pl-9"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
              </div>

              {/* Numbered Pagination */}
              {filteredProducts.length > 0 && totalPages > 1 && (
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 text-slate-400 hover:text-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "h-8 w-8 p-0 font-bold text-xs transition-all",
                          currentPage === page
                            ? "bg-[#16213e] hover:bg-[#1c2b50] text-white shadow-md shadow-blue-900/20"
                            : "text-slate-500 hover:bg-white hover:text-[#16213e]"
                        )}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 text-slate-400 hover:text-slate-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-20">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
          {paginatedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="bg-slate-100 p-4 rounded-full mb-3">
                <Search className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-medium">{t('pos.empty_cart_title')}</p>
              <p className="text-sm">{t('staff.try_adjusting')}</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* RIGHT SIDE - Desktop Sidebar */}
      <div className="hidden lg:flex w-[380px] border-l border-purple-100/50 flex-col shadow-2xl bg-purple-50/60 backdrop-blur-md h-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
        {orderPanelContent}
      </div>

      {/* MOBILE FAB & SHEET */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-[#16213e] hover:bg-[#1c2b50] z-50 flex flex-col items-center justify-center border-2 border-white"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white shadow-sm">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0 flex flex-col h-[100dvh] bg-purple-50/90 border-l border-purple-200/50 backdrop-blur-xl">
            <SheetHeader>
              <SheetTitle className="sr-only">Order Cart</SheetTitle>
              <SheetDescription className="sr-only">Items in your cart</SheetDescription>
            </SheetHeader>
            {orderPanelContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* PAYMENT MODAL */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {t('pos.payment_modal.title')} - {tableNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Summary in Modal */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between font-bold text-lg border-b pb-2">
                <span>{t('pos.payment_modal.total_due')}</span>
                <span>€{(total + Number(tipAmount)).toFixed(2)}</span>
              </div>
            </div>

            {/* Tips Amount */}
            <div>
              <p className="text-sm font-medium mb-2">{t('pos.payment_modal.tip_amount')}</p>
              <div className="flex items-center gap-2">
                <Input
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="text-2xl font-bold text-center h-14"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Numpad */}
            <Numpad value={tipAmount} onChange={setTipAmount} />

            {/* Payment Methods */}
            <div>
              <p className="text-sm text-gray-500 mb-2">{t('pos.payment_modal.payment_method')}</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedPaymentMethod === 'CASH' ? 'default' : 'outline'}
                  className={cn(
                    'h-16 flex-col',
                    selectedPaymentMethod === 'CASH' && 'bg-[#16213e] hover:bg-[#16213e]/90'
                  )}
                  onClick={() => setSelectedPaymentMethod('CASH')}
                >
                  <Banknote className="h-5 w-5 mb-1" />
                  <span className="text-xs">{t('pos.payment_modal.cash')}</span>
                </Button>
                <Button
                  variant={selectedPaymentMethod === 'DEBIT_CARD' ? 'default' : 'outline'}
                  className={cn(
                    'h-16 flex-col',
                    selectedPaymentMethod === 'DEBIT_CARD' && 'bg-[#16213e] hover:bg-[#16213e]/90'
                  )}
                  onClick={() => setSelectedPaymentMethod('DEBIT_CARD')}
                >
                  <CreditCard className="h-5 w-5 mb-1" />
                  <span className="text-xs">{t('pos.payment_modal.card')}</span>
                </Button>
                <Button
                  variant={selectedPaymentMethod === 'E_WALLET' ? 'default' : 'outline'}
                  className={cn(
                    'h-16 flex-col',
                    selectedPaymentMethod === 'E_WALLET' && 'bg-[#16213e] hover:bg-[#16213e]/90'
                  )}
                  onClick={() => setSelectedPaymentMethod('E_WALLET')}
                >
                  <Wallet className="h-5 w-5 mb-1" />
                  <span className="text-xs">{t('pos.payment_modal.wallet')}</span>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
              {t('pos.payment_modal.cancel')}
            </Button>
            <Button
              className="bg-[#16213e] hover:bg-[#16213e]/90 flex-1"
              onClick={handleCompletePayment}
              disabled={!selectedPaymentMethod || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('pos.payment_modal.complete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSPage;