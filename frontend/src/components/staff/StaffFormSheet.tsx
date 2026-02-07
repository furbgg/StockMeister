import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { userService, User, UserDTO } from '@/services/userService';
import { toast } from 'sonner';
import { Loader2, User as UserIcon, Mail, Shield, Banknote, Clock, MapPin, Save, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StaffFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userToEdit?: User | null;
    onUserSaved: () => void;
}

const StaffFormSheet: React.FC<StaffFormSheetProps> = ({ open, onOpenChange, userToEdit, onUserSaved }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<UserDTO>({
        username: '',
        email: '',
        role: '',
        phone: '',
        salary: 0,
        timings: '',
        address: '',
        password: 'tempPassword123!', // Default password for new users
    });
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                username: userToEdit.username,
                email: userToEdit.email,
                role: userToEdit.role,
                phone: userToEdit.phone || '',
                salary: userToEdit.salary || 0,
                timings: userToEdit.timings || '',
                address: userToEdit.address || '',
            });
        } else {
            setFormData({
                username: '',
                email: '',
                role: '',
                phone: '',
                salary: 0,
                timings: '',
                address: '',
                password: 'stockmeister2026!',
            });
        }
    }, [userToEdit, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (value: string) => {
        setFormData((prev) => ({ ...prev, role: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.username || !formData.email || !formData.role) {
            toast.error('Please fill in all required fields (Name, Email, Role)');
            setLoading(false);
            return;
        }

        try {
            if (userToEdit) {
                await userService.updateUser(userToEdit.id, formData);
                toast.success(t('staff.toast.save_success'));
            } else {
                await userService.createUser(formData);
                toast.success(t('staff.toast.save_success'));
            }
            onUserSaved();
            onOpenChange(false);
        } catch (error: any) {
            // Error handled by toast below
            toast.error(t('staff.toast.save_fail'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className={cn(
                "border-none text-white sm:max-w-md p-0 overflow-hidden",
                "bg-gradient-to-br from-[#16213e] via-[#0f172a] to-[#0a0f1e] backdrop-blur-3xl shadow-2xl shadow-blue-900/40"
            )}>
                <div className="h-full flex flex-col relative group/modal">
                    {/* Glossy Sheen Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-20 opacity-30 group-hover/modal:opacity-40 transition-opacity duration-1000" />

                    {/* Decorative light effects */}
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-white/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[30%] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

                    {/* Header */}
                    <div className="p-10 pb-8 relative z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl shadow-black/20">
                                {userToEdit ? <Plus className="h-7 w-7 text-white rotate-45" /> : <Plus className="h-7 w-7 text-white" />}
                            </div>
                            <div>
                                <SheetTitle className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                                    {userToEdit ? t('staff.form.title_edit') : t('staff.form.title_add')}
                                </SheetTitle>
                                <SheetDescription className="text-white/50 text-xs font-medium uppercase tracking-[0.2em] mt-1.5 opacity-80">
                                    {t('staff.form.subtitle')}
                                </SheetDescription>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-10 relative z-10">
                        <form onSubmit={handleSubmit} id="staff-form" className="space-y-8 pb-10">
                            <div className="flex items-center gap-3 ml-1 mb-2">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{t('staff.form.section_identity')}</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>

                            <div className="space-y-6">
                                {/* Name */}
                                <div className="space-y-3">
                                    <Label htmlFor="username" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                                        <UserIcon className="h-3 w-3" /> {t('staff.form.full_name')}
                                    </Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        placeholder="e.g. Master Chef Watson"
                                        value={formData.username}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('username')}
                                        onBlur={() => setFocusedField(null)}
                                        className={cn(
                                            "h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                                            "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0",
                                            focusedField === 'username' && "translate-y-[-2px] shadow-lg shadow-white/5"
                                        )}
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> {t('staff.form.electronic_mail')}
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="e.g. watson@luxury.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        disabled={!!userToEdit}
                                        className={cn(
                                            "h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                                            "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0",
                                            "disabled:opacity-40 disabled:cursor-not-allowed",
                                            focusedField === 'email' && "translate-y-[-2px] shadow-lg shadow-white/5"
                                        )}
                                    />
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-3">
                                    <Label htmlFor="role" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                                        <Shield className="h-3 w-3" /> {t('staff.form.assigned_privilege')}
                                    </Label>
                                    <Select value={formData.role} onValueChange={handleRoleChange}>
                                        <SelectTrigger className={cn(
                                            "h-14 bg-white/5 border-white/10 text-white rounded-2xl transition-all duration-500 focus:ring-0",
                                            "focus:bg-white focus:text-[#16213e] focus:border-white"
                                        )}>
                                            <SelectValue placeholder={t('staff.form.assign_role')} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#16213e] border-white/10 text-white">
                                            <SelectItem value="ADMIN" className="focus:bg-white/10 focus:text-white">{t('staff.form.roles.ADMIN')}</SelectItem>
                                            <SelectItem value="CHEF" className="focus:bg-white/10 focus:text-white">{t('staff.form.roles.CHEF')}</SelectItem>
                                            <SelectItem value="INVENTORY_MANAGER" className="focus:bg-white/10 focus:text-white">{t('staff.form.roles.INVENTORY_MANAGER')}</SelectItem>
                                            <SelectItem value="WAITER" className="focus:bg-white/10 focus:text-white">{t('staff.form.roles.WAITER')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 ml-1 mb-2 pt-4">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{t('staff.form.section_logistics')}</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Salary */}
                                    <div className="space-y-3">
                                        <Label htmlFor="salary" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                                            <Banknote className="h-3 w-3" /> {t('staff.salary')}
                                        </Label>
                                        <Input
                                            id="salary"
                                            name="salary"
                                            type="number"
                                            placeholder="2200.00"
                                            value={formData.salary}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('salary')}
                                            onBlur={() => setFocusedField(null)}
                                            className={cn(
                                                "h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                                                "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0",
                                                focusedField === 'salary' && "translate-y-[-2px] shadow-lg shadow-white/5"
                                            )}
                                        />
                                    </div>
                                    {/* Hours */}
                                    <div className="space-y-3">
                                        <Label htmlFor="timings" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> {t('staff.form.duration')}
                                        </Label>
                                        <Input
                                            id="timings"
                                            name="timings"
                                            placeholder="9am to 6pm"
                                            value={formData.timings}
                                            onChange={handleChange}
                                            onFocus={() => setFocusedField('timings')}
                                            onBlur={() => setFocusedField(null)}
                                            className={cn(
                                                "h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500",
                                                "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0",
                                                focusedField === 'timings' && "translate-y-[-2px] shadow-lg shadow-white/5"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-3">
                                    <Label htmlFor="address" className="text-xs font-bold text-white/70 uppercase tracking-[0.15em] ml-1 flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> {t('staff.form.domain_address')}
                                    </Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        placeholder="Full residential details..."
                                        value={formData.address}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('address')}
                                        onBlur={() => setFocusedField(null)}
                                        className={cn(
                                            "bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl transition-all duration-500 resize-none min-h-[100px] px-5 py-4",
                                            "focus:bg-white focus:text-[#16213e] focus:border-white focus:ring-0",
                                            focusedField === 'address' && "translate-y-[-2px] shadow-lg shadow-white/5"
                                        )}
                                    />
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
                                onClick={() => onOpenChange(false)}
                                className="flex-1 h-14 text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-500 font-bold uppercase tracking-[0.2em] text-[10px]"
                            >
                                {t('staff.form.discard')}
                            </Button>
                            <Button
                                type="submit"
                                form="staff-form"
                                disabled={loading}
                                className={cn(
                                    "flex-[2] h-14 bg-white text-[#16213e] hover:bg-gray-50 rounded-2xl transition-all duration-500 font-black uppercase tracking-[0.15em] text-xs shadow-2xl active:scale-[0.97]",
                                    "hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                                )}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        <span>{t('staff.form.authorize')}</span>
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

export default StaffFormSheet;
