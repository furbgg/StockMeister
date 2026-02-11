import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ingredientService, Ingredient, getImageUrl } from '@/services/ingredientService';
import { nutritionApiService, NutritionData } from '@/services/nutritionApiService';
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  Loader2,

  ChevronDown,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';

// Sabit kategori listesi - Avusturya mutfağına uygun
const INGREDIENT_CATEGORIES = [
  'Fleisch & Geflügel',      // Et & Kümes
  'Fisch & Meeresfrüchte',   // Balık & Deniz Ürünleri
  'Milchprodukte',           // Süt Ürünleri
  'Gemüse',                  // Sebze
  'Obst',                    // Meyve
  'Getreide & Mehl',         // Tahıl & Un
  'Gewürze & Kräuter',       // Baharat & Otlar
  'Öle & Fette',             // Yağ & Yağlar
  'Getränke',                // İçecek
  'Backzutaten',             // Fırın Malzemeleri
  'Konserven',               // Konserve
  'Saucen & Dips',           // Sos & Diplar
  'Sonstiges',               // Diğer
];

const IngredientsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [thresholdMultiplier, setThresholdMultiplier] = useState('1.0');
  const [formOpen, setFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<number | null>(null);

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientService.getAll,
  });

  const {
    data: lowStockIngredients = [],
    isLoading: lowStockLoading,
    refetch: refetchLowStock,
  } = useQuery({
    queryKey: ['ingredients', 'lowStock', thresholdMultiplier],
    queryFn: () => ingredientService.getLowStock(parseFloat(thresholdMultiplier)),
    enabled: false,
  });

  const createMutation = useMutation({
    mutationFn: ({ data, image }: { data: Ingredient; image: File | null }) =>
      ingredientService.create(data, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success('Ingredient created successfully!');
      setFormOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create ingredient');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, image }: { id: number; data: Ingredient; image: File | null }) =>
      ingredientService.update(id, data, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success('Ingredient updated successfully!');
      setFormOpen(false);
      setEditingIngredient(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update ingredient');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ingredientService.delete(id),
    onSuccess: () => {
      // Önce dialog'u kapat ve state'i temizle
      setDeleteConfirmOpen(false);
      setIngredientToDelete(null);
      // Sonra veriyi yenile
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success('Ingredient deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete ingredient');
      setDeleteConfirmOpen(false);
      setIngredientToDelete(null);
    },
  });

  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ? true : ing.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(ingredients.map((i) => i.category).filter(Boolean)));

  const handleLowStockSearch = () => {
    setShowLowStock(true);
    refetchLowStock();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <PageHeader
        title={t('ingredients.title')}
        description={t('ingredients.subtitle')}
      >
        <Button
          onClick={() => {
            setEditingIngredient(null);
            setFormOpen(true);
          }}
          className="bg-[#16213e] hover:bg-[#1f2d52] shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('ingredients.add_ingredient')}
        </Button>
      </PageHeader>

      <div className="grid gap-6">
        {/* Controls Bar */}
        <div className="relative flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-purple-50/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-xl border border-purple-100/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />

          {/* Filters Group */}
          <div className="relative flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Input
                placeholder={t('ingredients.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 focus:bg-white focus:ring-2 focus:ring-[#16213e]/20 transition-all rounded-lg"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('ingredients.filter.all_categories')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Low Stock Toggle */}
            <Button
              variant={showLowStock ? 'default' : 'outline'}
              onClick={() => setShowLowStock(!showLowStock)}
              className={cn(
                "w-full sm:w-auto transition-all duration-300 border-slate-200",
                showLowStock
                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
              )}
            >
              <AlertTriangle className={cn("mr-2 h-4 w-4", showLowStock ? "fill-current" : "")} />
              Low Stock Only
            </Button>
          </div>

          {/* Low Stock Stats (conditionally visible in extended mode) */}
          {showLowStock && (
            <div className="flex items-center gap-2 w-full xl:w-auto bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-800/50 animate-in fade-in slide-in-from-right-4">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">{t('ingredients.low_stock_stats.parameters')}:</span>
              <div className="flex items-center gap-2">
                <Label htmlFor="threshold" className="text-xs text-amber-700 whitespace-nowrap">{t('ingredients.low_stock_stats.threshold')}</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.1"
                  value={thresholdMultiplier}
                  onChange={(e) => setThresholdMultiplier(e.target.value)}
                  className="w-16 h-7 text-xs bg-white border-amber-200 focus-visible:ring-amber-500"
                />
                <Button
                  size="sm"
                  onClick={handleLowStockSearch}
                  disabled={lowStockLoading}
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {lowStockLoading ? <Loader2 className="animate-spin h-3 w-3" /> : "Update"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Alert Card (Only if active and has items) */}
        {showLowStock && lowStockIngredients.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-100 rounded-full">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-amber-900">Critical Stock Items</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockIngredients.map((ing) => (
                <Badge
                  key={ing.id}
                  variant="outline"
                  className="bg-white border-amber-200 text-amber-800 px-3 py-1 shadow-sm flex items-center gap-2 hover:border-amber-300 transition-colors"
                >
                  <span>{ing.name}</span>
                  <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {ing.currentStock}/{ing.minimumStock} {ing.unit}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Main Table Card */}
        <Card className="relative border border-purple-100/50 dark:border-slate-700/50 bg-purple-50/60 dark:bg-slate-800/60 shadow-lg overflow-hidden rounded-xl ring-1 ring-slate-900/5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
          {/* Table Header Decoration */}
          <div className="h-1 w-full bg-gradient-to-r from-[#16213e] via-[#2c3e6d] to-[#16213e]" />

          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)] min-h-[500px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-b border-purple-100/20">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-24 pl-6 font-semibold text-[#16213e] dark:text-slate-300">{t('common.image')}</TableHead>
                    <TableHead className="font-semibold text-[#16213e] dark:text-slate-300">{t('common.name')}</TableHead>
                    <TableHead className="font-semibold text-[#16213e] dark:text-slate-300">{t('common.category')}</TableHead>
                    <TableHead className="font-semibold text-[#16213e] dark:text-slate-300">{t('common.stock')}</TableHead>
                    <TableHead className="font-semibold text-[#16213e] dark:text-slate-300">{t('common.price')}</TableHead>
                    <TableHead className="w-32 text-center font-semibold text-[#16213e] dark:text-slate-300 pr-6">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skel-${i}`} className="border-b border-slate-50 dark:border-slate-800">
                        <TableCell className="pl-6 py-4"><Skeleton className="h-12 w-12 rounded-lg" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
                        <TableCell className="pr-6"><div className="flex justify-center gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div></TableCell>
                      </TableRow>
                    ))
                  ) : filteredIngredients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                          <Search className="h-16 w-16 text-slate-300" />
                          <p className="text-lg font-medium text-slate-500">No ingredients found</p>
                          <p className="text-sm text-slate-400">Try adjusting your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIngredients.map((ing) => {
                      const isLow = parseFloat(ing.currentStock || '0') <= parseFloat(ing.minimumStock || '0');

                      return (
                        <TableRow
                          key={ing.id}
                          className={cn(
                            "group border-b border-slate-50 dark:border-slate-800 transition-colors",
                            isLow ? "bg-amber-50/30 dark:bg-amber-900/20 hover:bg-amber-50/60 dark:hover:bg-amber-900/30" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                          )}
                        >
                          <TableCell className="pl-6 py-4">
                            <div className={cn(
                              "w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shadow-sm border transition-all duration-300",
                              isLow ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                            )}>
                              {ing.imagePath ? (
                                <img
                                  src={getImageUrl(ing.imagePath) || undefined}
                                  alt={ing.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : <ImageIcon className="h-5 w-5 text-slate-300" />}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-base">{ing.name}</div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                              {ing.category}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "font-bold text-sm px-2.5 py-1 rounded-md border",
                                isLow
                                  ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800"
                                  : "bg-blue-50 dark:bg-blue-900/30 text-[#16213e] dark:text-blue-300 border-blue-100 dark:border-blue-800"
                              )}>
                                {ing.currentStock} <span className="text-xs font-normal opacity-70 ml-0.5">{ing.unit}</span>
                              </div>
                              {isLow && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
                                  <AlertTriangle className="h-3 w-3 text-red-600" />
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="font-medium text-slate-600 dark:text-slate-300 bg-transparent border-slate-200 dark:border-slate-700 tabular-nums">
                              ${Number(ing.unitPrice).toFixed(2)}
                            </Badge>
                          </TableCell>

                          <TableCell className="pr-6">
                            <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-blue-600 rounded-md transition-all"
                                onClick={() => { setEditingIngredient(ing); setFormOpen(true); }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-red-600 rounded-md transition-all"
                                onClick={() => { setIngredientToDelete(ing.id!); setDeleteConfirmOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      <IngredientFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingIngredient(null); }}
        ingredient={editingIngredient}
        onSubmit={(data: Ingredient, image: File | null) => {
          if (editingIngredient?.id) updateMutation.mutate({ id: editingIngredient.id, data, image });
          else createMutation.mutate({ data, image });
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the ingredient.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ingredientToDelete && deleteMutation.mutate(ingredientToDelete)}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// --- SUBSIDIARY COMPONENT: IngredientFormDialog ---
interface IngredientFormDialogProps {
  open: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
  onSubmit: (data: Ingredient, image: File | null) => void;
  isLoading: boolean;
}

const IngredientFormDialog = ({ open, onClose, ingredient, onSubmit, isLoading }: IngredientFormDialogProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Ingredient>({
    name: '', category: '', unit: '', currentStock: '0', minimumStock: '0', unitPrice: '0'
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showNutrition, setShowNutrition] = useState(false);
  const [nutritionQuery, setNutritionQuery] = useState('');
  const [nutritionResults, setNutritionResults] = useState<NutritionData[]>([]);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (ingredient) {
      setFormData(ingredient);
      setImagePreview(ingredient.imagePath ? getImageUrl(ingredient.imagePath) : null);
    } else {
      setFormData({ name: '', category: '', unit: '', currentStock: '0', minimumStock: '0', unitPrice: '0' });
      setImagePreview(null);
    }
    setSelectedImage(null);
  }, [ingredient, open]);

  const handleSearchNutrition = async () => {
    setNutritionLoading(true);
    try {
      const res = await nutritionApiService.searchProduct(nutritionQuery);
      setNutritionResults(res);
    } catch (e) {
      toast.error("Nutrition search failed");
    } finally {
      setNutritionLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className={cn(
        "border-none text-white sm:max-w-xl p-0 overflow-hidden",
        "bg-gradient-to-br from-[#7c3176] via-[#60265b] to-[#4a1d46] backdrop-blur-3xl shadow-2xl shadow-purple-900/40"
      )}>
        <div className="h-full flex flex-col relative group/modal">
          {/* Glossy Sheen Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-20 opacity-30 group-hover/modal:opacity-40 transition-opacity duration-1000" />

          {/* Decorative light effects */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-white/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[30%] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="p-10 pb-8 relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl shadow-black/20">
                <Plus className="h-7 w-7 text-white" />
              </div>
              <div>
                <SheetTitle className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {ingredient ? t('ingredients.master_entry.edit_item') : t('ingredients.master_entry.title')}
                </SheetTitle>
                <SheetDescription className="text-white/50 text-xs font-medium uppercase tracking-[0.2em] mt-1.5 opacity-80">
                  {t('ingredients.master_entry.subtitle')}
                </SheetDescription>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-10 relative z-10">
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData, selectedImage); }} id="ingredient-form" className="space-y-10 pb-10">
              {/* Image Upload Area */}
              <div className="space-y-4">
                <Label className="text-[11px] font-bold text-white/40 uppercase tracking-[0.25em] ml-1">{t('ingredients.master_entry.presentation_image')}</Label>
                <div
                  className={cn(
                    "group/img relative w-full h-48 rounded-3xl border border-white/10 transition-all duration-700 overflow-hidden shadow-2xl",
                    imagePreview
                      ? "bg-black/40 ring-1 ring-white/20"
                      : "bg-white/5 hover:bg-white/10 border-dashed border-white/20 hover:border-white/40"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover/img:opacity-80 transition-opacity duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-500 transform scale-90 group-hover/img:scale-100">
                        <div className="p-4 bg-white/10 rounded-full backdrop-blur-2xl border border-white/30 shadow-2xl">
                          <ImageIcon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-5">
                      <div className="p-4 bg-white/5 rounded-3xl border border-white/10 group-hover/img:border-white/30 group-hover/img:scale-105 transition-all duration-500 shadow-xl">
                        <ImageIcon className="h-10 w-10 text-white/20 group-hover/img:text-white/60 transition-colors" />
                      </div>
                      <div className="text-center px-6">
                        <p className="text-white font-semibold tracking-wide">{t('ingredients.master_entry.upload_text')}</p>
                      </div>
                    </div>
                  )}

                  {imagePreview && (
                    <button
                      type="button"
                      className="absolute top-4 right-4 bg-white/10 hover:bg-red-500 backdrop-blur-xl text-white rounded-2xl p-3 shadow-2xl border border-white/20 transition-all z-30 group/btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(null);
                        setImagePreview(null);
                        setFormData({ ...formData, imagePath: undefined });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <Trash2 className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Data Inputs Group */}
              <div className="space-y-8">
                <div className="flex items-center gap-3 ml-1 mb-2">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{t('ingredients.master_entry.section_specs')}</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="grid gap-6">
                  {/* Name field */}
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">
                      {t('ingredients.master_entry.label_name')}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setNutritionQuery(e.target.value); }}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder={t('ingredients.master_entry.placeholder_name')}
                      className={cn(
                        "h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                        "focus:bg-white focus:text-[#16213e] focus:border-white focus:shadow-[0_0_30px_rgba(255,255,255,0.15)] focus:ring-0",
                        "group-hover/input:border-white/20 text-lg font-medium",
                        focusedField === 'name' && "translate-y-[-2px]"
                      )}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Category field */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">{t('ingredients.master_entry.label_category')}</Label>
                      <Select
                        value={formData.category || ''}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className={cn(
                          "h-14 bg-white/5 border-white/10 text-white rounded-2xl transition-all duration-500",
                          "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0",
                          "group-hover/input:border-white/20"
                        )}>
                          <SelectValue placeholder={t('ingredients.master_entry.placeholder_category')} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#16213e] border-white/10 text-white">
                          {INGREDIENT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="focus:bg-white/10 focus:text-white">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unit Price field */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">{t('ingredients.master_entry.label_valuation')}</Label>
                      <div className="relative group/input">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.unitPrice}
                          onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                          onFocus={() => setFocusedField('price')}
                          onBlur={() => setFocusedField(null)}
                          className={cn(
                            "h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                            "focus:bg-white focus:text-[#16213e] focus:border-white focus:shadow-[0_0_30px_rgba(255,255,255,0.15)] focus:ring-0",
                            "group-hover/input:border-white/20 font-bold",
                            focusedField === 'price' && "translate-y-[-2px]"
                          )}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {/* Current Stock */}
                    <div className="space-y-3 col-span-1">
                      <Label className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">{t('ingredients.master_entry.label_stock')}</Label>
                      <Input
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                        onFocus={() => setFocusedField('stock')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "h-14 bg-white/5 border-white/10 text-white rounded-2xl transition-all duration-500",
                          "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0",
                          focusedField === 'stock' && "translate-y-[-2px]"
                        )}
                        required
                      />
                    </div>

                    {/* Unit */}
                    <div className="space-y-3 col-span-1">
                      <Label className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">{t('ingredients.master_entry.label_unit')}</Label>
                      <Input
                        placeholder="kg/lt"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        onFocus={() => setFocusedField('unit')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "h-14 bg-white/5 border-white/10 text-white rounded-2xl transition-all duration-500 uppercase",
                          "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0",
                          focusedField === 'unit' && "translate-y-[-2px]"
                        )}
                        required
                      />
                    </div>

                    {/* Min Stock */}
                    <div className="space-y-3 col-span-1">
                      <Label className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">{t('ingredients.master_entry.label_threshold')}</Label>
                      <Input
                        type="number"
                        value={formData.minimumStock}
                        onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                        onFocus={() => setFocusedField('min')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "h-14 bg-white/10 border-white/20 text-white rounded-2xl transition-all duration-500",
                          "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0",
                          focusedField === 'min' && "translate-y-[-2px]"
                        )}
                        required
                      />
                    </div>
                  </div>

                  {/* Nutrition Section */}
                  <div className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4 backdrop-blur-md">
                    <div className="flex justify-between items-center cursor-pointer group/nutrition" onClick={() => setShowNutrition(!showNutrition)}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg group-hover/nutrition:bg-white/20 transition-colors">
                          <Search className="h-4 w-4 text-white/70" />
                        </div>
                        <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em]">{t('ingredients.master_entry.section_nutrition')}</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-white/40 transition-transform duration-500", showNutrition && "rotate-180")} />
                    </div>
                    {showNutrition && (
                      <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('ingredients.master_entry.nutrition_identify')}
                            value={nutritionQuery}
                            onChange={(e) => setNutritionQuery(e.target.value)}
                            className="h-11 bg-white/5 border-white/10 text-white rounded-xl focus:bg-white focus:text-slate-900 transition-all"
                          />
                          <Button
                            type="button"
                            onClick={handleSearchNutrition}
                            disabled={nutritionLoading}
                            className="h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl px-5"
                          >
                            {nutritionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : t('ingredients.master_entry.nutrition_discover')}
                          </Button>
                        </div>
                        <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                          {nutritionResults.map((res, i) => (
                            <div key={i} className="group/res text-xs p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex justify-between items-center transition-all duration-300">
                              <div className="space-y-1">
                                <p className="font-bold text-white/90">{res.productName}</p>
                                <p className="text-white/40 text-[10px] uppercase font-black">{res.nutriments?.calories || 0} kcal / 100g</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                className="h-8 bg-white/10 hover:bg-white hover:text-[#16213e] rounded-lg text-[10px] font-bold uppercase py-0"
                                onClick={() => { setFormData({ ...formData, nutritionInfo: res }); toast.success("Intel applied"); }}
                              >
                                Apply
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </ScrollArea>

          {/* Luxury Action Bar */}
          <div className="p-10 pt-6 border-t border-white/10 bg-black/40 backdrop-blur-3xl relative z-30">
            <div className="flex gap-5">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 h-14 text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-500 font-bold uppercase tracking-[0.2em] text-[10px]"
              >
                {t('ingredients.master_entry.btn_discard')}
              </Button>
              <Button
                type="submit"
                form="ingredient-form"
                disabled={isLoading}
                className={cn(
                  "flex-[2] h-14 bg-white text-[#7c3176] hover:bg-gray-50 rounded-2xl transition-all duration-500 font-black uppercase tracking-[0.15em] text-xs shadow-2xl active:scale-[0.97]",
                  "hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    <span>{t('ingredients.master_entry.btn_archive')}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IngredientsPage;