import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wasteService } from '@/services/wasteService';
import { ingredientService, Ingredient } from '@/services/ingredientService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import WasteAnalyticsSection from '@/components/waste/WasteAnalyticsSection';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTranslation } from 'react-i18next';

const WasteManagementPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State'leri
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const { data: wasteLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['wasteLogs'],
    queryFn: wasteService.getAll,
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: wasteService.create,
    onSuccess: () => {
      toast.success('Waste recorded successfully', {
        description: 'Stock has been automatically deducted.',
      });
      setIsOpen(false);
      setQuantity('');
      setReason('');
      setSelectedIngredientId('');
      queryClient.invalidateQueries({ queryKey: ['wasteLogs'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: () => {
      toast.error('Failed to record waste.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: wasteService.delete,
    onSuccess: () => {
      toast.success('Record deleted', {
        description: 'Stock has been restored.',
      });
      queryClient.invalidateQueries({ queryKey: ['wasteLogs'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: () => toast.error('Failed to delete record'),
  });

  const handleSubmit = () => {
    if (!selectedIngredientId || !quantity || !reason) {
      toast.warning('Please fill in all fields.');
      return;
    }
    createMutation.mutate({
      ingredientId: Number(selectedIngredientId),
      quantity: parseFloat(quantity),
      reason: reason,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure? Stock will be restored.')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredLogs = Array.isArray(wasteLogs)
    ? wasteLogs.filter(log =>
      (log.ingredientName && log.ingredientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    : [];

  if (isLogsLoading) return <div className="p-8">Loading waste records...</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* ÜST BAŞLIK VE EKLEME BUTONU */}
      <PageHeader
        title={t('waste_management.title')}
        description={t('waste_management.subtitle')}
      >
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="bg-[#7c3176] hover:bg-[#60265b] text-white shadow-xl hover:shadow-purple-900/20 active:scale-95 transition-all h-11 px-6 rounded-2xl font-bold uppercase tracking-wider text-xs">
              <Plus className="mr-2 h-4 w-4" /> {t('waste_management.add_waste')}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className={cn(
            "border-none text-white sm:max-w-md p-0 overflow-hidden",
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
                    <Trash2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                      {t('waste_management.record_modal.title')}
                    </SheetTitle>
                    <SheetDescription className="text-white/50 text-xs font-medium uppercase tracking-[0.2em] mt-1.5 opacity-80">
                      {t('waste_management.record_modal.subtitle')}
                    </SheetDescription>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 px-10 py-4 flex flex-col gap-10 overflow-y-auto relative z-10">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 ml-1 mb-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{t('waste_management.record_modal.section_title')}</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>

                  <div className="grid gap-8">
                    {/* Ingredient Selection */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">{t('waste_management.record_modal.product_label')}</Label>
                      <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                        <SelectTrigger className={cn(
                          "h-14 bg-white/5 border-white/10 text-white rounded-2xl transition-all duration-500",
                          "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0 group/sel",
                          "hover:border-white/20"
                        )}>
                          <SelectValue placeholder={t('waste_management.record_modal.product_placeholder')} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#16213e] border-white/10 text-white">
                          {Array.isArray(ingredients) && ingredients.map((ing: Ingredient) => (
                            <SelectItem key={ing.id} value={ing.id?.toString() || ''} className="focus:bg-white/10 focus:text-white py-3">
                              <div className="flex justify-between items-center w-full min-w-[200px]">
                                <span className="font-bold">{ing.name}</span>
                                <span className="text-[10px] font-black uppercase text-white/30 bg-white/5 px-2 py-1 rounded-lg">
                                  {ing.currentStock} {ing.unit} avail.
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Quantity */}
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">{t('waste_management.record_modal.quantity_label')}</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className={cn(
                            "h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                            "focus:bg-white focus:text-[#16213e] focus:border-white focus:shadow-[0_0_30px_rgba(255,255,255,0.15)] focus:ring-0",
                            "hover:border-white/20 text-lg font-bold"
                          )}
                        />
                      </div>

                      {/* Reason */}
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1">{t('waste_management.record_modal.reason_label')}</Label>
                        <Input
                          placeholder={t('waste_management.record_modal.reason_placeholder')}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className={cn(
                            "h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                            "focus:bg-white focus:text-[#16213e] focus:border-white focus:shadow-[0_0_30px_rgba(255,255,255,0.15)] focus:ring-0",
                            "hover:border-white/20 font-medium"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Luxury Action Bar */}
              <div className="p-10 pt-6 border-t border-white/10 bg-black/40 backdrop-blur-3xl relative z-30">
                <Button
                  className={cn(
                    "w-full h-14 bg-white text-[#7c3176] hover:bg-gray-50 rounded-2xl transition-all duration-500 font-black uppercase tracking-[0.15em] text-xs shadow-2xl active:scale-[0.97]",
                    "hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                  )}
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>{t('waste_management.record_modal.submit_button')}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </PageHeader>

      {/* Analytics Section */}
      <WasteAnalyticsSection />

      {/* Main Content Grid */}
      <div className="grid gap-6">
        {/* Controls Bar */}
        <div className="relative flex flex-col sm:flex-row gap-4 justify-between items-center bg-purple-50/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-xl border border-purple-100/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
          <div className="relative flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Trash2 className="h-4 w-4" />
            <span className="text-sm font-medium">{t('waste_management.history.title')}</span>
          </div>

          <div className="relative w-full sm:w-72">
            <Input
              placeholder={t('waste_management.history.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 focus:bg-white focus:ring-2 focus:ring-[#7c3176]/20 transition-all rounded-lg"
            />
          </div>
        </div>

        {/* Table Card */}
        <Card className="relative border border-purple-100/50 dark:border-slate-700/50 bg-purple-50/60 dark:bg-slate-800/60 shadow-lg overflow-hidden rounded-xl ring-1 ring-slate-900/5 shadow-purple-900/5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
          <div className="h-1 w-full bg-gradient-to-r from-[#7c3176] via-[#9b4d94] to-[#7c3176]" />
          <CardContent className="p-0">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-b border-purple-100/20">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-1/4 font-semibold text-[#7c3176] dark:text-purple-300">{t('waste_management.history.table.ingredient')}</TableHead>
                  <TableHead className="font-semibold text-[#7c3176] dark:text-purple-300">{t('waste_management.history.table.category')}</TableHead>
                  <TableHead className="font-semibold text-[#7c3176] dark:text-purple-300">{t('waste_management.history.table.amount')}</TableHead>
                  <TableHead className="w-1/3 font-semibold text-[#7c3176] dark:text-purple-300">{t('waste_management.history.table.reason')}</TableHead>
                  <TableHead className="font-semibold text-[#7c3176] dark:text-purple-300">{t('waste_management.history.table.date')}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="group hover:bg-purple-50/20 dark:hover:bg-slate-800/40 border-b border-purple-50/40 dark:border-slate-800 transition-colors">
                      <TableCell className="font-medium text-slate-700 dark:text-slate-200">{log.ingredientName || 'Unknown'}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-600">
                          {log.ingredientCategory || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-[#7c3176] dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-800 text-xs">
                          -{log.quantity} {log.ingredientUnit}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">{log.reason}</TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 text-sm tabular-nums">
                        {log.date ? new Date(log.date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          onClick={() => handleDelete(log.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3 opacity-50">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <Trash2 className="h-8 w-8 text-slate-400" />
                        </div>
                        <p>No waste records found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WasteManagementPage;