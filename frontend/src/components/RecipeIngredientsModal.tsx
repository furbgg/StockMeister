import { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ingredientService, Ingredient } from '@/services/ingredientService';
import {
  recipeService,
  Recipe,
  RecipeIngredient,
  RecipeIngredientRequest,
} from '@/services/recipeService';
import { Loader2, Plus, Trash2, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface RecipeIngredientsModalProps {
  open: boolean;
  onClose: () => void;
  recipe: Recipe;
}

const RecipeIngredientsModal = ({
  open,
  onClose,
  recipe,
}: RecipeIngredientsModalProps) => {
  // State
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for adding new ingredient
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { t } = useTranslation();

  // Fetch data when modal opens
  const fetchData = useCallback(async () => {
    if (!recipe?.id) return;

    setLoading(true);
    try {
      // Fetch both in parallel
      const [ingredientsRes, recipeIngredientsRes] = await Promise.all([
        ingredientService.getAll(),
        recipeService.getRecipeIngredients(recipe.id),
      ]);

      setAllIngredients(ingredientsRes || []);
      setRecipeIngredients(recipeIngredientsRes || []);
    } catch (error) {
      toast.error('Failed to load ingredients');
      setAllIngredients([]);
      setRecipeIngredients([]);
    } finally {
      setLoading(false);
    }
  }, [recipe?.id]);

  useEffect(() => {
    if (open && recipe?.id) {
      fetchData();
      // Reset form
      setSelectedIngredientId('');
      setQuantity('1');
    }
  }, [open, recipe?.id, fetchData]);

  // Get ingredients that are NOT already in the recipe
  const availableIngredients = allIngredients.filter((ing) => {
    if (!ing.id) return false;
    return !recipeIngredients.some((ri) => ri.ingredient?.id === ing.id);
  });

  // Handle adding an ingredient
  const handleAddIngredient = async () => {
    if (!selectedIngredientId || !recipe?.id) {
      toast.error('Please select an ingredient');
      return;
    }

    const amountNum = parseFloat(quantity);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setSaving(true);
    try {
      const existingItems: RecipeIngredientRequest[] = recipeIngredients.map((ri) => ({
        ingredientId: Number(ri.ingredient?.id),
        amount: Number(ri.amount) || 0,
      }));

      const newItem: RecipeIngredientRequest = {
        ingredientId: Number(selectedIngredientId),
        amount: amountNum,
      };

      const payload = [...existingItems, newItem];
      await recipeService.updateRecipeIngredients(recipe.id, payload);

      toast.success('Ingredient added successfully');
      await fetchData();

      setSelectedIngredientId('');
      setQuantity('1');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add ingredient');
    } finally {
      setSaving(false);
    }
  };

  // Handle removing an ingredient
  const handleRemoveIngredient = async (ingredientIdToRemove: number) => {
    if (!recipe?.id) return;

    setSaving(true);
    try {
      const updatedItems: RecipeIngredientRequest[] = recipeIngredients
        .filter((ri) => ri.ingredient?.id !== ingredientIdToRemove)
        .map((ri) => ({
          ingredientId: Number(ri.ingredient?.id),
          amount: Number(ri.amount) || 0,
        }));

      await recipeService.updateRecipeIngredients(recipe.id, updatedItems);
      toast.success('Ingredient removed successfully');
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove ingredient');
    } finally {
      setSaving(false);
    }
  };

  // Calculate total cost
  const calculateTotalCost = (): number => {
    if (!recipeIngredients || recipeIngredients.length === 0) return 0;
    let total = 0;
    for (const ri of recipeIngredients) {
      const amount = parseFloat(String(ri.amount || 0));
      const unitPrice = parseFloat(String(ri.ingredient?.unitPrice || 0));
      if (!isNaN(amount) && !isNaN(unitPrice)) {
        total += amount * unitPrice;
      }
    }
    return Math.round(total * 100) / 100;
  };

  const totalCost = calculateTotalCost();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className={cn(
        "border-none text-white sm:max-w-2xl p-0 overflow-hidden",
        "bg-gradient-to-br from-[#7c3176] via-[#60265b] to-[#4a1d46] backdrop-blur-3xl shadow-2xl shadow-purple-900/40"
      )}>
        <div className="h-full flex flex-col relative group/modal">
          {/* Glossy Sheen Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-20 opacity-30 group-hover/modal:opacity-40 transition-opacity duration-1000" />

          {/* Decorative light effects */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-white/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[30%] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="p-10 pb-6 relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl shadow-black/20">
                <Utensils className="h-7 w-7 text-white" />
              </div>
              <div>
                <SheetTitle className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {t('recipes.calculator.title')}
                </SheetTitle>
                <SheetDescription className="text-white/50 text-xs font-medium uppercase tracking-[0.2em] mt-1 opacity-80">
                  {t('recipes.calculator.subtitle')}
                </SheetDescription>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
              <span>{t('recipes.calculator.optimizing_for')}</span>
              <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md border border-white/10">{recipe?.name || 'Recipe'}</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="p-5 bg-white/5 rounded-3xl border border-white/10 animate-pulse">
                  <Loader2 className="h-10 w-10 animate-spin text-white/40" />
                </div>
                <p className="text-white/40 font-medium tracking-widest uppercase text-[10px]">Syncing Archive...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 px-10">
                  <div className="space-y-8 pb-10">
                    {/* Metrics Bar */}
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{t('recipes.calculator.total_cost')}</Label>
                        <div className="text-3xl font-black text-white flex items-baseline gap-1">
                          <span className="text-sm font-medium text-white/50">€</span>
                          {totalCost.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{t('recipes.calculator.component_count')}</Label>
                        <div className="text-xl font-bold text-white flex items-center justify-end gap-2">
                          {recipeIngredients.length}
                          <span className="text-[10px] font-medium text-white/40 px-2 py-0.5 bg-white/5 rounded-lg border border-white/10">ITEMS</span>
                        </div>
                      </div>
                    </div>

                    {/* Add Ingredient Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 ml-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{t('recipes.calculator.quick_add')}</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                      </div>

                      <div className="grid grid-cols-12 gap-4 items-end bg-white/5 p-6 rounded-3xl border border-white/10">
                        <div className="col-span-12 md:col-span-6 space-y-2">
                          <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t('recipes.calculator.labels.ingredient')}</Label>
                          <Select
                            value={selectedIngredientId}
                            onValueChange={setSelectedIngredientId}
                          >
                            <SelectTrigger className={cn(
                              "h-12 bg-white/5 border-white/10 text-white rounded-xl transition-all duration-300",
                              "focus:bg-white focus:text-[#16213e] focus:ring-0"
                            )}>
                              <SelectValue placeholder="Choose an ingredient..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#16213e] border-white/10 text-white">
                              {availableIngredients.length === 0 ? (
                                <SelectItem value="none" disabled>No ingredients available</SelectItem>
                              ) : (
                                availableIngredients.map((ing) => (
                                  <SelectItem key={ing.id} value={String(ing.id)} className="focus:bg-white focus:text-[#16213e]">
                                    {ing.name} ({ing.unit}) — €{ing.unitPrice}/unit
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-8 md:col-span-4 space-y-2">
                          <Label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">{t('recipes.calculator.labels.quantity')}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            onFocus={() => setFocusedField('qty')}
                            onBlur={() => setFocusedField(null)}
                            className={cn(
                              "h-12 bg-white/5 border-white/10 text-white rounded-xl transition-all duration-300",
                              "focus:bg-white focus:text-[#16213e] focus:ring-0 font-bold",
                              focusedField === 'qty' && "scale-105"
                            )}
                          />
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <Button
                            onClick={handleAddIngredient}
                            disabled={saving || !selectedIngredientId}
                            className="w-full h-12 rounded-xl bg-white text-[#7c3176] hover:bg-white/90 shadow-xl shadow-white/5 active:scale-95 transition-all"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 ml-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{t('recipes.calculator.active_breakdown')}</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden shadow-2xl">
                        <Table>
                          <TableHeader className="bg-white/5 border-b border-white/5">
                            <TableRow className="hover:bg-transparent border-none">
                              <TableHead className="text-[10px] font-black text-white/40 uppercase pl-6 py-4">{t('recipes.calculator.labels.ingredient')}</TableHead>
                              <TableHead className="text-[10px] font-black text-white/40 uppercase">{t('recipes.calculator.labels.details')}</TableHead>
                              <TableHead className="text-[10px] font-black text-white/40 uppercase text-right pr-6">{t('recipes.calculator.labels.line_cost')}</TableHead>
                              <TableHead className="w-16"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recipeIngredients.length === 0 ? (
                              <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="h-32 text-center text-white/20 text-xs font-medium uppercase tracking-widest">
                                  No components formulated
                                </TableCell>
                              </TableRow>
                            ) : (
                              recipeIngredients.map((ri) => {
                                const amount = parseFloat(String(ri.amount || 0));
                                const unitPrice = parseFloat(String(ri.ingredient?.unitPrice || 0));
                                const lineCost = amount * unitPrice;

                                return (
                                  <TableRow key={ri.id || ri.ingredient?.id} className="group border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                      <div className="font-bold text-white group-hover:text-purple-200 transition-colors uppercase tracking-tight">
                                        {ri.ingredient?.name}
                                      </div>
                                      <div className="text-[10px] text-white/30 font-medium">{ri.ingredient?.category || 'General'}</div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black text-[10px]">
                                          {amount} {ri.ingredient?.unit}
                                        </Badge>
                                        <span className="text-[10px] text-white/30">@ €{unitPrice}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-black text-white group-hover:text-purple-300">
                                      €{lineCost.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="pr-4">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        onClick={() => handleRemoveIngredient(ri.ingredient.id)}
                                        disabled={saving}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Pricing Intelligence */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 ml-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{t('recipes.calculator.valuation')}</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Aggressive', mult: 3.0, icon: '📉', color: 'bg-rose-500/10 border-rose-500/20 text-rose-200', desc: 'max_volume' },
                          { label: 'Balanced', mult: 3.5, icon: '⚖️', color: 'bg-amber-500/10 border-amber-500/20 text-amber-200', desc: 'standard' },
                          { label: 'Premium', mult: 4.5, icon: '🛡️', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200', desc: 'high_margin' }
                        ].map((tier) => (
                          <div key={tier.label} className={cn(
                            "group/tier relative p-4 rounded-3xl border transition-all duration-500 hover:scale-105",
                            tier.color
                          )}>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{t(`recipes.calculator.tiers.${tier.label.toLowerCase()}`)}</span>
                                <span className="text-xs group-hover/tier:animate-bounce">{tier.icon}</span>
                              </div>
                              <div className="text-xl font-black tracking-tight">€{(totalCost * tier.mult).toFixed(2)}</div>
                              <div className="text-[9px] font-bold opacity-30 mt-1 uppercase tracking-tighter">{t(`recipes.calculator.tiers_labels.${tier.desc}`)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Footer Action Bar */}
                <div className="p-10 pt-6 border-t border-white/10 bg-black/40 backdrop-blur-3xl flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{t('recipes.calculator.system_online')}</span>
                  </div>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="h-12 px-8 text-white/40 hover:text-white hover:bg-white/5 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all"
                  >
                    {t('recipes.calculator.exit')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RecipeIngredientsModal;