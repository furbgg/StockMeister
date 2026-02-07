import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ingredientService, Ingredient, getImageUrl } from '@/services/ingredientService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Save, Loader2, Image as ImageIcon, ClipboardCheck, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Backend'e gidecek veri tipi
interface StockAdjustment {
  ingredientId: number;
  physicalCount: number;
}

const StockCountPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [counts, setCounts] = useState<Record<number, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: ingredients = [], isLoading } = useQuery<Ingredient[]>({
    queryKey: ['ingredients'],
    queryFn: ingredientService.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: async (adjustments: StockAdjustment[]) => {
      await ingredientService.updateStockCount(adjustments);
    },
    onSuccess: () => {
      toast.success('Stock counts updated successfully');
      setCounts({});
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: () => {
      toast.error('Failed to update stock counts');
    },
  });

  const handleInputChange = (id: number, value: string) => {
    setCounts(prev => ({ ...prev, [id]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const adjustments: StockAdjustment[] = Object.entries(counts)
      .map(([id, count]) => ({
        ingredientId: Number(id),
        physicalCount: parseFloat(count),
      }))
      .filter(item => !isNaN(item.physicalCount));

    if (adjustments.length === 0) {
      toast.warning('No valid changes to save');
      return;
    }

    updateMutation.mutate(adjustments);
  };

  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];

  const filteredIngredients = safeIngredients.filter((ing: Ingredient) => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ing.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(safeIngredients.map((i: Ingredient) => i.category).filter(Boolean))) as string[];

  const totalItems = filteredIngredients.length;
  const itemsCounted = Object.keys(counts).length;
  const progress = totalItems > 0 ? (itemsCounted / totalItems) * 100 : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <PageHeader
        title={t('stock_count.title')}
        description={t('stock_count.description')}
      >
        {/* Action Button - Moved to Header for consistency */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className={cn(
            "transition-all duration-300 shadow-md hover:shadow-lg min-w-[160px]",
            hasChanges
              ? "bg-[#16213e] hover:bg-[#1f2d52] text-white"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed hidden sm:flex"
          )}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('stock_count.save_adjustments')}
            </>
          )}
        </Button>
      </PageHeader>

      {/* Main Content Grid */}
      <div className="grid gap-6">

        {/* Controls Bar & Progress */}
        <div className="relative flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-purple-50/60 backdrop-blur-md p-4 rounded-xl border border-purple-100/50 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />

          {/* Progress / Stat */}
          <div className="relative flex items-center gap-4 w-full xl:w-auto p-2 rounded-lg bg-white/40 backdrop-blur-sm border border-purple-100/20">
            <div className="p-2 bg-white rounded-md shadow-sm">
              <ClipboardCheck className="h-5 w-5 text-[#7c3176]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('stock_count.session_progress')}</span>
              <div className="flex items-end gap-2">
                <span className="text-lg font-bold text-slate-900">{itemsCounted}</span>
                <span className="text-sm text-slate-400 pb-0.5">/ {totalItems} {t('stock_count.items')}</span>
              </div>
            </div>
            {/* Simple visual progress bar */}
            <div className="h-1.5 flex-1 w-24 bg-slate-200 rounded-full ml-4 overflow-hidden">
              <div
                className="h-full bg-[#7c3176] transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
            {/* Search */}
            <div className="relative w-full xl:w-80">
              <Input
                placeholder={t('stock_count.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/60 backdrop-blur-sm border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#7c3176]/20 transition-all rounded-lg"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/60 backdrop-blur-sm border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#7c3176]/20 transition-all rounded-lg">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('stock_count.all_categories')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table Card */}
        <Card className="relative border border-purple-100/50 bg-purple-50/60 shadow-lg overflow-hidden rounded-xl ring-1 ring-slate-900/5 shadow-blue-900/5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 pointer-events-none" />
          {/* Header Decoration */}
          <div className="h-1 w-full bg-gradient-to-r from-[#16213e] via-[#2c3e6d] to-[#16213e]" />

          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/40 backdrop-blur-sm border-b border-purple-100/20">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-20 pl-6 font-semibold text-slate-700">{t('stock_count.table.image')}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{t('stock_count.table.product_name')}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{t('stock_count.table.category')}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{t('stock_count.table.system_stock')}</TableHead>
                    <TableHead className="w-[180px] font-semibold text-slate-700">{t('stock_count.table.physical_count')}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{t('stock_count.table.variance')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                          <p className="text-muted-foreground animate-pulse">Loading inventory data...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredIngredients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                          <Search className="h-16 w-16 text-slate-300" />
                          <p className="text-lg font-medium text-slate-500">No items found</p>
                          <p className="text-sm text-slate-400">Try adjusting your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIngredients.map((ingredient: Ingredient) => {
                      const systemStock = parseFloat(ingredient.currentStock || '0');
                      const inputVal = counts[ingredient.id!];
                      // If input is empty string, don't show variance yet (treat as matching system stock for variance calc purposes visually, or show nothing)
                      // Actually better to show variance only if input is present.
                      const physicalCount = inputVal !== undefined && inputVal !== '' ? parseFloat(inputVal) : systemStock;

                      const isChanged = inputVal !== undefined && inputVal !== '';
                      const variance = isChanged ? physicalCount - systemStock : 0;
                      const varianceColor = variance < 0 ? 'text-[#7c3176]' : variance > 0 ? 'text-emerald-600' : 'text-slate-400';
                      const varianceBg = variance < 0 ? 'bg-purple-50' : variance > 0 ? 'bg-emerald-50' : 'bg-slate-50';
                      const varianceIcon = variance < 0 ? <ArrowDownRight className="h-4 w-4" /> : variance > 0 ? <ArrowUpRight className="h-4 w-4" /> : <Minus className="h-3 w-3" />;

                      return (
                        <TableRow
                          key={ingredient.id}
                          className={cn(
                            "group border-b border-slate-50 transition-colors hover:bg-slate-50/50",
                            isChanged && "bg-blue-50/30"
                          )}
                        >
                          <TableCell className="pl-6 py-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                              {ingredient.imagePath ? (
                                <img
                                  src={getImageUrl(ingredient.imagePath) || ''}
                                  alt={ingredient.name}
                                  className="w-full h-full object-cover"
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
                              {ingredient.category}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <span className="font-medium text-slate-600">{systemStock}</span>
                            <span className="text-xs text-slate-400 ml-1">{ingredient.unit}</span>
                          </TableCell>

                          <TableCell>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder={systemStock.toString()}
                                value={inputVal || ''}
                                onChange={(e) => handleInputChange(ingredient.id!, e.target.value)}
                                className={cn(
                                  "w-32 transition-all font-semibold pr-8 text-right",
                                  isChanged
                                    ? "border-blue-400 ring-4 ring-blue-500/10 text-blue-700 bg-white"
                                    : "border-slate-200 text-slate-700 bg-slate-50/50 hover:bg-white focus:bg-white"
                                )}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                                {ingredient.unit}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            {isChanged ? (
                              <div className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 w-fit rounded-full text-sm font-bold border",
                                varianceColor, varianceBg,
                                variance < 0 ? "border-purple-100" : variance > 0 ? "border-emerald-100" : "border-slate-100"
                              )}>
                                {varianceIcon}
                                {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
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

      </div>
      {/* Floating Action Button for Mobile */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 sm:hidden z-50">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            size="lg"
            className="rounded-full shadow-xl bg-[#16213e] hover:bg-[#1f2d52] h-14 w-14 p-0 flex items-center justify-center animate-in zoom-in duration-300"
          >
            {updateMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StockCountPage;