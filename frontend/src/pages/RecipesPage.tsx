import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { recipeService, Recipe, getImageUrl } from '@/services/recipeService';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Save,
  DollarSign,
  Utensils,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RecipeIngredientsModal from '@/components/RecipeIngredientsModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTranslation } from 'react-i18next';

// ==================== MAIN COMPONENT ====================

const RecipesPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Form Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<number | null>(null);

  // Ingredient Modal states - CRITICAL: separate state for the recipe
  const [ingredientsModalOpen, setIngredientsModalOpen] = useState(false);
  const [selectedRecipeForIngredients, setSelectedRecipeForIngredients] = useState<Recipe | null>(null);

  // Fetch recipes
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipeService.getAll(true),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: ({ data, image }: { data: Partial<Recipe>; image: File | null }) =>
      recipeService.create(data, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe created successfully!');
      setFormOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create recipe');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      image,
    }: {
      id: number;
      data: Partial<Recipe>;
      image: File | null;
    }) => recipeService.update(id, data, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe updated successfully!');
      setFormOpen(false);
      setEditingRecipe(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update recipe');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => recipeService.delete(id),
    onSuccess: () => {
      // Önce dialog'u kapat ve state'i temizle
      setDeleteConfirmOpen(false);
      setRecipeToDelete(null);
      // Sonra veriyi yenile
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete recipe');
      setDeleteConfirmOpen(false);
      setRecipeToDelete(null);
    },
  });

  // Tab state for Recipes vs Beverages
  const [activeTab, setActiveTab] = useState<'recipes' | 'beverages'>('recipes');
  const [addingBeverage, setAddingBeverage] = useState(false);

  // Filter recipes - separate kitchen items and beverages
  const kitchenRecipes = (recipes || [])
    .filter((recipe) => recipe?.sendToKitchen !== false)
    .filter((recipe) => recipe?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const beverageRecipes = (recipes || [])
    .filter((recipe) => recipe?.sendToKitchen === false)
    .filter((recipe) => recipe?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const displayedRecipes = activeTab === 'recipes' ? kitchenRecipes : beverageRecipes;

  // Handle opening ingredients modal
  const handleOpenIngredientsModal = (recipe: Recipe) => {
    if (!recipe || !recipe.id) {
      toast.error('Invalid recipe selected');
      return;
    }
    setSelectedRecipeForIngredients(recipe);
    setIngredientsModalOpen(true);
  };

  // Handle closing ingredients modal
  const handleCloseIngredientsModal = () => {
    setIngredientsModalOpen(false);
    // Delay clearing the recipe to prevent UI flash
    setTimeout(() => {
      setSelectedRecipeForIngredients(null);
    }, 200);
    // Refresh recipes to get updated ingredient counts
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <PageHeader
        title={t('recipes.management_title')}
        description={t('recipes.management_subtitle')}
      >
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setEditingRecipe(null);
              setAddingBeverage(false);
              setFormOpen(true);
            }}
            className="bg-[#16213e] hover:bg-[#1f2d52] shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('recipes.add_recipe')}
          </Button>
          <Button
            onClick={() => {
              setEditingRecipe(null);
              setAddingBeverage(true);
              setFormOpen(true);
            }}
            variant="outline"
            className="border-blue-100 text-[#16213e] hover:bg-blue-50/50 hover:border-blue-200 dark:border-slate-600 dark:text-blue-300 dark:hover:bg-slate-800/50 dark:hover:border-slate-500 shadow-sm transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('recipes.add_beverage')}
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6">
        {/* Controls & Stats */}
        <div className="relative flex flex-col sm:flex-row gap-4 justify-between items-center bg-purple-50/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-xl border border-purple-100/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />

          {/* Tabs - Pill Style */}
          <div className="relative flex gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg overflow-hidden self-start sm:self-auto border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab('recipes')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 flex items-center gap-2',
                activeTab === 'recipes'
                  ? 'bg-white text-[#7c3176] dark:bg-slate-700 dark:text-purple-300 shadow-sm ring-1 ring-[#7c3176]/10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/50'
              )}
            >
              <Utensils className="h-4 w-4" />
              {t('recipes.tabs.recipes')}
              <span className={cn(
                "ml-1 text-xs py-0.5 px-1.5 rounded-full",
                activeTab === 'recipes' ? "bg-[#7c3176]/10 text-[#7c3176]" : "bg-slate-200 dark:bg-slate-700"
              )}>
                {kitchenRecipes.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('beverages')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 flex items-center gap-2',
                activeTab === 'beverages'
                  ? 'bg-white text-[#16213e] dark:bg-slate-700 dark:text-blue-300 shadow-sm ring-1 ring-[#16213e]/10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/50'
              )}
            >
              <div className="h-4 w-4 text-[#16213e]">🥤</div>
              {t('recipes.tabs.beverages')}
              <span className={cn(
                "ml-1 text-xs py-0.5 px-1.5 rounded-full",
                activeTab === 'beverages' ? "bg-blue-50 text-[#16213e] border border-blue-100/50" : "bg-slate-200 dark:bg-slate-700"
              )}>
                {beverageRecipes.length}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Input
              placeholder={t('recipes.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 focus:bg-white focus:ring-2 focus:ring-[#7c3176]/20 transition-all rounded-lg pl-9"
            />
          </div>
        </div>

        {/* Modern Table Card */}
        <Card className={cn(
          "relative border border-purple-100/50 dark:border-slate-700/50 bg-purple-50/60 dark:bg-slate-800/60 shadow-lg overflow-hidden rounded-xl transition-all duration-500",
          activeTab === 'recipes' ? 'shadow-[#7c3176]/5' : 'shadow-emerald-500/5'
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
          {/* Table Header Decoration */}
          <div className={cn(
            "h-1 w-full bg-gradient-to-r",
            activeTab === 'recipes'
              ? "from-[#16213e] via-[#2c3e6d] to-[#16213e]"
              : "from-[#16213e] via-[#3a508d] to-[#16213e]"
          )} />

          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)] min-h-[500px]">
              <Table>
                <TableHeader className={cn(
                  "sticky top-0 z-10 relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm",
                  activeTab === 'recipes' ? "bg-white/40 dark:bg-slate-900/40" : "bg-white/40 dark:bg-slate-900/40"
                )}>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="w-24 pl-6 font-semibold text-slate-700 dark:text-slate-300">{t('common.image')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('common.name')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">{t('common.description')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('common.price')}</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">{t('recipes.table.ingredients')}</TableHead>
                    <TableHead className="w-40 text-center font-semibold text-slate-700 dark:text-slate-300 pr-6">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className={cn(
                            "h-10 w-10 animate-spin",
                            activeTab === 'recipes' ? "text-[#16213e]" : "text-[#16213e]"
                          )} />
                          <p className="text-muted-foreground animate-pulse">{t('recipes.messages.loading')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayedRecipes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-96 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                          <Utensils className="h-16 w-16 text-slate-300" />
                          <p className="text-lg font-medium text-slate-500">{t('recipes.messages.no_recipes')}</p>
                          <p className="text-sm text-slate-400">Add a new item to get started</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedRecipes.map((recipe: Recipe) => {
                      const imageUrl = getImageUrl(recipe?.imagePath);
                      const ingredientCount = recipe?.ingredients?.length ?? 0;

                      return (
                        <TableRow
                          key={recipe.id}
                          className="group border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          {/* Image */}
                          <TableCell className="pl-6 py-4">
                            <div className={cn(
                              "w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shadow-sm border transition-all duration-300 group-hover:scale-105 group-hover:shadow-md",
                              activeTab === 'recipes' ? "bg-blue-50 border-blue-100 dark:bg-slate-800 dark:border-slate-700" : "bg-blue-50 border-blue-100 dark:bg-slate-800 dark:border-slate-700"
                            )}>
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={recipe.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    if (target.nextElementSibling) {
                                      (target.nextElementSibling as HTMLElement).classList.remove('hidden');
                                    }
                                  }}
                                />
                              ) : null}
                              <ImageIcon
                                className={cn(
                                  'h-6 w-6',
                                  imageUrl ? 'hidden' : '',
                                  activeTab === 'recipes' ? "text-[#16213e]/30" : "text-[#16213e]/30"
                                )}
                              />
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-base">{recipe.name}</div>
                            {recipe.category && (
                              <div className="text-xs text-slate-400 mt-0.5">{recipe.category}</div>
                            )}
                          </TableCell>

                          <TableCell className="max-w-[200px] hidden md:table-cell">
                            <div className="truncate text-slate-500 dark:text-slate-400 text-sm" title={recipe.description}>
                              {recipe.description || '-'}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "border-0 font-medium px-2.5 py-1",
                                activeTab === 'recipes'
                                  ? "bg-blue-50 text-[#16213e] border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                                  : "bg-blue-50 text-[#16213e] border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                              )}
                            >
                              <DollarSign className="h-3 w-3 mr-1 opacity-70" />
                              {Number(recipe.sellingPrice).toFixed(2)}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              {ingredientCount > 0 ? (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200">
                                  {t('recipes.item_count', { count: ingredientCount })}
                                </Badge>
                              ) : (
                                <span className="text-sm text-slate-400 italic">None</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="pr-6">
                            <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              {/* Edit */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-blue-600 rounded-lg transition-all"
                                title={t('recipes.tooltips.edit')}
                                onClick={() => {
                                  setEditingRecipe(recipe);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              {/* Manage Ingredients */}
                              {recipe.sendToKitchen !== false && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-[#7c3176] rounded-lg transition-all"
                                  title={t('recipes.tooltips.manage_ingredients')}
                                  onClick={() => handleOpenIngredientsModal(recipe)}
                                >
                                  <Utensils className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Delete */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm hover:text-red-600 rounded-lg transition-all"
                                title={t('recipes.tooltips.delete')}
                                onClick={() => {
                                  setRecipeToDelete(recipe.id ?? null);
                                  setDeleteConfirmOpen(true);
                                }}
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

      {/* Form Dialog */}
      <RecipeFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingRecipe(null);
          setAddingBeverage(false);
        }}
        recipe={editingRecipe}
        isBeverage={addingBeverage}
        onSubmit={(data, image) => {
          // For beverages, add category and sendToKitchen
          const submitData = addingBeverage
            ? { ...data, category: 'Getränke', sendToKitchen: false }
            : data;

          if (editingRecipe?.id) {
            updateMutation.mutate({ id: editingRecipe.id, data: submitData, image });
          } else {
            createMutation.mutate({ data: submitData, image });
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recipe? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (recipeToDelete) {
                  deleteMutation.mutate(recipeToDelete);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CRITICAL: Only render modal when we have a valid recipe selected */}
      {selectedRecipeForIngredients && selectedRecipeForIngredients.id && (
        <RecipeIngredientsModal
          open={ingredientsModalOpen}
          onClose={handleCloseIngredientsModal}
          recipe={selectedRecipeForIngredients}
        />
      )}
    </div>
  );
};

// ==================== FORM DIALOG COMPONENT ====================

interface RecipeFormDialogProps {
  open: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  isBeverage?: boolean;
  onSubmit: (data: Partial<Recipe>, image: File | null) => void;
  isLoading: boolean;
}

const RecipeFormDialog = ({
  open,
  onClose,
  recipe,
  isBeverage = false,
  onSubmit,
  isLoading,
}: RecipeFormDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    sellingPrice: string;
    imagePath?: string | null;
  }>({
    name: '',
    description: '',
    sellingPrice: '0',
    imagePath: undefined,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { t } = useTranslation();

  // Reset form when dialog opens/closes or recipe changes
  useEffect(() => {
    if (open) {
      if (recipe) {
        setFormData({
          name: recipe.name || '',
          description: recipe.description || '',
          sellingPrice: String(recipe.sellingPrice || '0'),
          imagePath: recipe.imagePath || undefined,
        });
        if (recipe.imagePath) {
          setImagePreview(getImageUrl(recipe.imagePath));
        } else {
          setImagePreview(null);
        }
        setSelectedImage(null);
        setImageRemoved(false);
      } else {
        setFormData({
          name: '',
          description: '',
          sellingPrice: '0',
          imagePath: undefined,
        });
        setImagePreview(null);
        setSelectedImage(null);
        setImageRemoved(false);
      }
    }
  }, [recipe, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageRemoved(true);
    setFormData(prev => ({ ...prev, imagePath: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Recipe name is required');
      return;
    }
    // If image was explicitly removed, include imagePath: null in the data
    const submitData = imageRemoved
      ? { ...formData, imagePath: null }
      : formData;
    // Cast to any to allow null imagePath which backend might handle but interface doesn't
    onSubmit(submitData as any, selectedImage);
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
                <Utensils className="h-7 w-7 text-white" />
              </div>
              <div>
                <SheetTitle className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {recipe
                    ? (isBeverage ? t('recipes.form.edit_item') : t('recipes.form.edit_recipe'))
                    : (isBeverage ? t('recipes.form.new_item') : t('recipes.form.new_recipe'))
                  }
                </SheetTitle>
                <SheetDescription className="text-white/50 text-xs font-medium uppercase tracking-[0.2em] mt-1.5 opacity-80">
                  {t('recipes.form.portal_title')}
                </SheetDescription>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-10 relative z-10">
            <form onSubmit={handleSubmit} id="recipe-form" className="space-y-10 pb-10">
              {/* Image Upload Area */}
              <div className="space-y-4">
                <Label className="text-[11px] font-bold text-white/40 uppercase tracking-[0.25em] ml-1">{t('recipes.form.presentation_image')}</Label>
                <div
                  className={cn(
                    "group/img relative w-full h-64 rounded-3xl border border-white/10 transition-all duration-700 overflow-hidden shadow-2xl",
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
                      <div className="p-5 bg-white/5 rounded-3xl border border-white/10 group-hover/img:border-white/30 group-hover/img:scale-105 transition-all duration-500 shadow-xl">
                        <ImageIcon className="h-12 w-12 text-white/20 group-hover/img:text-white/60 transition-colors" />
                      </div>
                      <div className="text-center px-6">
                        <p className="text-white font-semibold tracking-wide">{t('recipes.form.upload_masterpiece')}</p>
                        <p className="text-white/30 text-xs mt-2 font-medium tracking-tight">{t('recipes.form.upload_hint')}</p>
                      </div>
                    </div>
                  )}

                  {imagePreview && (
                    <button
                      type="button"
                      className="absolute top-6 right-6 bg-white/10 hover:bg-red-500 backdrop-blur-xl text-white rounded-2xl p-3 shadow-2xl border border-white/20 transition-all z-30 group/btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
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
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Data Inputs Group */}
              <div className="space-y-8">
                <div className="flex items-center gap-3 ml-1 mb-2">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{t('recipes.form.section_specs')}</span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="grid gap-6">
                  {/* Name field */}
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1 flex items-center justify-between">
                      {t('recipes.form.name_label')}
                      {focusedField === 'name' && <span className="text-white/20 animate-pulse text-[9px] font-black">editing...</span>}
                    </Label>
                    <div className="relative group/input">
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder={t('recipes.form.placeholder_name')}
                        className={cn(
                          "h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                          "focus:bg-white focus:text-[#16213e] focus:border-white focus:shadow-[0_0_30px_rgba(255,255,255,0.15)] focus:ring-0",
                          "group-hover/input:border-white/20 text-lg font-medium",
                          focusedField === 'name' && "translate-y-[-2px]"
                        )}
                        required
                      />
                    </div>
                  </div>

                  {/* Price field */}
                  <div className="space-y-3">
                    <Label htmlFor="sellingPrice" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">
                      {t('recipes.form.price_label')}
                    </Label>
                    <div className="relative group/input">
                      <div className={cn(
                        "absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center transition-all duration-500",
                        focusedField === 'price' ? "text-[#16213e]" : "text-white/20"
                      )}>
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <Input
                        id="sellingPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        onFocus={() => setFocusedField('price')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "h-14 pl-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                          "focus:bg-white focus:text-[#16213e] focus:border-white focus:shadow-[0_0_30px_rgba(255,255,255,0.15)] focus:ring-0",
                          "group-hover/input:border-white/20 text-xl font-bold",
                          focusedField === 'price' && "translate-y-[-2px]"
                        )}
                        required
                      />
                    </div>
                  </div>

                  {/* Description field */}
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">
                      {t('recipes.form.description_label')}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      onFocus={() => setFocusedField('description')}
                      onBlur={() => setFocusedField(null)}
                      placeholder={t('recipes.form.placeholder_desc')}
                      rows={5}
                      className={cn(
                        "bg-white/5 border-white/10 text-white/90 placeholder:text-white/10 rounded-2xl transition-all duration-500 resize-none px-5 py-4",
                        "focus:bg-white focus:text-[#16213e] focus:border-white focus:shadow-[0_0_30px_rgba(255,255,255,0.15)] focus:ring-0",
                        "group-hover/input:border-white/20 leading-relaxed font-medium",
                        focusedField === 'description' && "translate-y-[-2px]"
                      )}
                    />
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
                {t('recipes.form.cancel_btn')}
              </Button>
              <Button
                type="submit"
                form="recipe-form"
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
                    <span>{t('recipes.form.save_btn')}</span>
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


export default RecipesPage;
