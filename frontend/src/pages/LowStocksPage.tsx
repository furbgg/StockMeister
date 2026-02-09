import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-toastify';
import { ingredientService, Ingredient, getImageUrl } from '@/services/ingredientService';
import {
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  PackageX,
  Package,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore, useLowStockNotification } from '@/stores/useNotificationStore';
import { PageHeader } from '@/components/layout/PageHeader';

type TabType = 'low-stock' | 'out-of-stock';

const LowStocksPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('low-stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [newStockValue, setNewStockValue] = useState('');

  // Notification store
  const { lowStockNotifyEnabled, toggleLowStockNotify } = useNotificationStore();
  const { notifyLowStock, notifyOutOfStock } = useLowStockNotification();

  // Track which ingredients we've already notified about (to avoid duplicate notifications)
  const notifiedIds = useRef<Set<number>>(new Set());

  // Fetch low stock ingredients (0 < currentStock < minimumStock)
  const { data: lowStockIngredients = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ['ingredients', 'low-stock-only'],
    queryFn: ingredientService.getLowStockOnly,
  });

  // Fetch out of stock ingredients (currentStock = 0)
  const { data: outOfStockIngredients = [], isLoading: outOfStockLoading } = useQuery({
    queryKey: ['ingredients', 'out-of-stock'],
    queryFn: ingredientService.getOutOfStock,
  });

  // Send notifications for low stock and out of stock items
  useEffect(() => {
    if (!lowStockNotifyEnabled) return;

    // Notify for low stock items
    lowStockIngredients.forEach((ingredient) => {
      if (ingredient.id && !notifiedIds.current.has(ingredient.id)) {
        notifiedIds.current.add(ingredient.id);
        notifyLowStock(
          ingredient.name,
          parseFloat(ingredient.currentStock || '0'),
          ingredient.unit || '',
          ingredient.id
        );
      }
    });

    // Notify for out of stock items
    outOfStockIngredients.forEach((ingredient) => {
      if (ingredient.id && !notifiedIds.current.has(ingredient.id)) {
        notifiedIds.current.add(ingredient.id);
        notifyOutOfStock(ingredient.name, ingredient.id);
      }
    });
  }, [lowStockIngredients, outOfStockIngredients, lowStockNotifyEnabled, notifyLowStock, notifyOutOfStock]);

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ id, newStock }: { id: number; newStock: number }) =>
      ingredientService.updateStock(id, newStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success('Stock updated successfully!');
      setUpdateDialogOpen(false);
      setSelectedIngredient(null);
      setNewStockValue('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update stock');
    },
  });

  // Get current data based on active tab
  const currentData = activeTab === 'low-stock' ? lowStockIngredients : outOfStockIngredients;
  const isLoading = activeTab === 'low-stock' ? lowStockLoading : outOfStockLoading;

  // Filter by search term
  const filteredData = currentData.filter((ing) =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Update Stock button click
  const handleUpdateStockClick = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setNewStockValue(ingredient.currentStock || '0');
    setUpdateDialogOpen(true);
  };

  // Handle stock update submission
  const handleUpdateStockSubmit = () => {
    if (!selectedIngredient?.id) return;
    const newStock = parseFloat(newStockValue);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }
    updateStockMutation.mutate({ id: selectedIngredient.id, newStock });
  };

  // Calculate missing amount
  const calculateMissingAmount = (currentStock: string | undefined, minimumStock: string | undefined): number => {
    const current = parseFloat(currentStock || '0');
    const minimum = parseFloat(minimumStock || '0');
    return Math.max(0, minimum - current);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <PageHeader
        title={t('stock_alerts.title')}
        description={t('stock_alerts.subtitle')}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6">

        {/* Controls Bar */}
        <div className="relative flex flex-col xl:flex-row gap-4 justify-between items-center bg-purple-50/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-xl border border-purple-100/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />

          {/* Tabs - Pill Style */}
          <div className="relative flex gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg overflow-hidden self-start sm:self-auto border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab('low-stock')}
              className={cn(
                'flex-1 xl:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 flex items-center justify-center gap-2',
                activeTab === 'low-stock'
                  ? 'bg-white dark:bg-slate-700 text-[#7c3176] dark:text-purple-300 shadow-sm ring-1 ring-[#7c3176]/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              {t('stock_alerts.tabs.low_stock')}
              {lowStockIngredients.length > 0 && (
                <span className={cn(
                  "ml-1 text-xs py-0.5 px-1.5 rounded-full",
                  activeTab === 'low-stock' ? "bg-[#7c3176]/10 text-[#7c3176]" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}>
                  {lowStockIngredients.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('out-of-stock')}
              className={cn(
                'flex-1 xl:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 flex items-center justify-center gap-2',
                activeTab === 'out-of-stock'
                  ? 'bg-white dark:bg-slate-700 text-[#7c3176] dark:text-purple-300 shadow-sm ring-1 ring-[#7c3176]/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
              )}
            >
              <PackageX className="h-4 w-4" />
              {t('stock_alerts.tabs.out_of_stock')}
              {outOfStockIngredients.length > 0 && (
                <span className={cn(
                  "ml-1 text-xs py-0.5 px-1.5 rounded-full",
                  activeTab === 'out-of-stock' ? "bg-[#7c3176]/10 text-[#7c3176]" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}>
                  {outOfStockIngredients.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Input
                placeholder={t('stock_alerts.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 focus:bg-white focus:ring-2 focus:ring-[#7c3176]/20 transition-all rounded-lg"
              />
            </div>

            {/* Notify Toggle */}
            <div className={cn(
              "relative flex items-center gap-3 px-4 py-2 rounded-lg border transition-all duration-300 w-full sm:w-auto justify-between sm:justify-start",
              lowStockNotifyEnabled
                ? "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-[#7c3176]/20 shadow-sm"
                : "bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200 dark:border-slate-700"
            )}>
              <div className="flex items-center gap-2">
                <Bell className={cn("h-4 w-4", lowStockNotifyEnabled ? "text-[#7c3176]" : "text-slate-400")} />
                <span className={cn("text-sm font-medium", lowStockNotifyEnabled ? "text-[#7c3176]" : "text-slate-500 dark:text-slate-400")}>
                  {t('stock_alerts.notifications')}
                </span>
              </div>
              <Switch
                checked={lowStockNotifyEnabled}
                onCheckedChange={toggleLowStockNotify}
                className="data-[state=checked]:bg-[#7c3176]"
              />
            </div>
          </div>
        </div>

        {/* Main Table Card - Lacivert Theme */}
        <Card className="relative border border-purple-100/50 dark:border-slate-700/50 bg-purple-50/60 dark:bg-slate-800/60 shadow-lg overflow-hidden rounded-xl transition-all duration-500 ring-1 ring-slate-900/5 shadow-[#16213e]/5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
          {/* Table Header Decoration */}
          <div className="h-1 w-full bg-gradient-to-r from-[#16213e] via-[#2a3a5f] to-[#16213e]" />

          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-420px)] min-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-b border-purple-100/20">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-12 pl-4">
                      <input type="checkbox" className="rounded border-slate-300 text-[#7c3176] focus:ring-[#7c3176]" />
                    </TableHead>
                    <TableHead className="w-20 font-semibold text-slate-700">{t('stock_alerts.table.image')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('stock_alerts.table.product_name')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('stock_alerts.table.category')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('stock_alerts.table.stock_level')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('stock_alerts.table.min_req')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('stock_alerts.table.missing')}</TableHead>
                    <TableHead className="w-36 text-center font-semibold text-slate-700 dark:text-slate-300 pr-6">{t('stock_alerts.table.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-80 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-10 w-10 animate-spin text-[#16213e]" />
                          <p className="text-muted-foreground animate-pulse">{t('stock_alerts.loading')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-80 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                          {activeTab === 'low-stock' ? (
                            <>
                              <div className="bg-[#7c3176]/10 p-4 rounded-full mb-2">
                                <Package className="h-12 w-12 text-[#7c3176]" />
                              </div>
                              <p className="text-lg font-medium text-slate-600">{t('stock_alerts.empty_state.title')}</p>
                              <p className="text-sm text-slate-400">{t('stock_alerts.empty_state.desc')}</p>
                            </>
                          ) : (
                            <>
                              <div className="bg-[#7c3176]/10 p-4 rounded-full mb-2">
                                <Package className="h-12 w-12 text-[#7c3176]" />
                              </div>
                              <p className="text-lg font-medium text-slate-600">{t('stock_alerts.empty_state.out_title')}</p>
                              <p className="text-sm text-slate-400">{t('stock_alerts.empty_state.out_desc')}</p>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((ingredient) => {
                      const imageUrl = getImageUrl(ingredient.imagePath);
                      const currentStock = parseFloat(ingredient.currentStock || '0');
                      const minimumStock = parseFloat(ingredient.minimumStock || '0');
                      const missingAmount = calculateMissingAmount(ingredient.currentStock, ingredient.minimumStock);
                      const isOutOfStock = currentStock === 0;
                      const isCritical = currentStock <= minimumStock * 0.25;

                      return (
                        <TableRow
                          key={ingredient.id}
                          className="group border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-[#16213e]/5 dark:hover:bg-slate-800/50"
                        >
                          <TableCell className="pl-4">
                            <input type="checkbox" className="rounded border-slate-300 text-[#7c3176] focus:ring-[#7c3176]" />
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-300 group-hover:scale-105 group-hover:border-[#16213e]/20 bg-white dark:bg-slate-800">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={ingredient.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-slate-300" />
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-semibold text-slate-800">{ingredient.name}</div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal border border-slate-200">
                              {ingredient.category || '-'}
                            </Badge>
                          </TableCell>

                          {/* Stock Level */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "font-bold text-sm px-2.5 py-1 rounded-md border flex items-center gap-1.5",
                                isOutOfStock
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : isCritical
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                              )}>
                                {ingredient.currentStock || '0'}
                                <span className="text-xs font-normal opacity-70">{ingredient.unit}</span>
                              </div>
                              {isOutOfStock && (
                                <div className="animate-pulse">
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-slate-500">
                            {ingredient.minimumStock || '0'} {ingredient.unit}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-semibold px-2 py-0.5 border-[#16213e]/10 text-[#16213e] bg-[#16213e]/5"
                            >
                              +{missingAmount.toFixed(1)} {ingredient.unit}
                            </Badge>
                          </TableCell>

                          <TableCell className="pr-6">
                            <Button
                              className="w-full shadow-sm hover:shadow-md transition-all text-white h-8 text-xs font-medium rounded-lg bg-[#7c3176] hover:bg-[#9b4d94]"
                              size="sm"
                              onClick={() => handleUpdateStockClick(ingredient)}
                            >
                              {t('stock_alerts.actions.refill_stock')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Summary Cards - Cinematic Theme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Low Stock Items */}
          <Card className="relative border border-purple-100/50 bg-purple-50/60 shadow-lg overflow-hidden rounded-xl transition-all duration-500 ring-1 ring-slate-900/5 shadow-[#16213e]/5 group hover:shadow-xl hover:border-purple-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
            <CardContent className="p-5 flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#16213e] rounded-xl shadow-lg shadow-[#16213e]/20 text-white group-hover:scale-110 transition-transform duration-300">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-[#16213e] font-bold uppercase tracking-wide">{t('stock_alerts.stats.low_stock_items')}</p>
                <p className="text-2xl font-bold text-slate-900">{lowStockIngredients.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock */}
          <Card className="relative border border-purple-100/50 bg-purple-50/60 shadow-lg overflow-hidden rounded-xl transition-all duration-500 ring-1 ring-slate-900/5 shadow-[#16213e]/5 group hover:shadow-xl hover:border-purple-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
            <CardContent className="p-5 flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#16213e] rounded-xl shadow-lg shadow-[#16213e]/20 text-white group-hover:scale-110 transition-transform duration-300">
                <PackageX className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-[#16213e] font-bold uppercase tracking-wide">{t('stock_alerts.stats.out_of_stock')}</p>
                <p className="text-2xl font-bold text-slate-900">{outOfStockIngredients.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Alerts */}
          <Card className="relative border border-purple-100/50 bg-purple-50/60 shadow-lg overflow-hidden rounded-xl transition-all duration-500 ring-1 ring-slate-900/5 shadow-[#16213e]/5 group hover:shadow-xl hover:border-purple-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
            <CardContent className="p-5 flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#16213e] rounded-xl shadow-lg shadow-[#16213e]/20 text-white group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-[#16213e] font-bold uppercase tracking-wide">{t('stock_alerts.stats.total_alerts')}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {lowStockIngredients.length + outOfStockIngredients.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Update Stock Sheet */}
      <Sheet open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <SheetContent side="right" className="bg-white p-0 border-l border-slate-100 sm:max-w-md">
          <div className="h-full flex flex-col bg-slate-50/50">
            {/* Sheet Header */}
            <div className="px-6 py-6 bg-white border-b border-slate-100">
              <SheetHeader className="text-left">
                <SheetTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 bg-[#7c3176]/10 rounded-lg">
                    <Package className="h-5 w-5 text-[#7c3176]" />
                  </div>
                  {t('stock_alerts.update_sheet.title')}
                </SheetTitle>
                <SheetDescription className="text-slate-500 mt-1">
                  {t('stock_alerts.update_sheet.desc_prefix')} <span className="font-semibold text-slate-800">{selectedIngredient?.name}</span>
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* Sheet Body */}
            <div className="flex-1 px-6 py-8 flex flex-col gap-6">
              {/* Status Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('stock_alerts.update_sheet.current_status')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-slate-500">{t('stock_alerts.update_sheet.current_stock')}</span>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedIngredient?.currentStock || '0'} <span className="text-sm font-normal text-slate-400">{selectedIngredient?.unit}</span>
                    </p>
                  </div>
                  <div className="space-y-1 border-l border-slate-100 pl-4">
                    <span className="text-sm text-slate-500">{t('stock_alerts.update_sheet.minimum_req')}</span>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedIngredient?.minimumStock || '0'} <span className="text-sm font-normal text-slate-400">{selectedIngredient?.unit}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Section */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('stock_alerts.update_sheet.new_quantity')}</h4>
                <div className="space-y-2">
                  <Label htmlFor="newStock" className="sr-only">New Stock Quantity</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        id="newStock"
                        type="number"
                        min="0"
                        step="0.1"
                        value={newStockValue}
                        onChange={(e) => setNewStockValue(e.target.value)}
                        className="h-12 text-lg font-bold pl-4 border-slate-200 focus-visible:ring-[#7c3176]"
                        placeholder={t('stock_alerts.update_sheet.placeholder')}
                        autoFocus
                      />
                    </div>
                    <div className="h-12 w-12 flex items-center justify-center bg-slate-100 rounded-lg font-semibold text-slate-500 border border-slate-200">
                      {selectedIngredient?.unit || '-'}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{t('stock_alerts.update_sheet.hint')}</p>
                </div>
              </div>
            </div>

            {/* Sheet Footer */}
            <SheetFooter className="px-6 py-4 bg-white border-t border-slate-100">
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={() => setUpdateDialogOpen(false)} className="flex-1 h-11 border-slate-200">
                  {t('stock_alerts.actions.cancel')}
                </Button>
                <Button
                  onClick={handleUpdateStockSubmit}
                  disabled={updateStockMutation.isPending}
                  className="flex-1 h-11 bg-[#7c3176] hover:bg-[#9b4d94] shadow-md hover:shadow-lg transition-all"
                >
                  {updateStockMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('stock_alerts.actions.update_now')}
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LowStocksPage;
