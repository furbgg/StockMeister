import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { settingsService, RestaurantSettings } from '@/services/settingsService';
import { userService, User } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    Building2,
    Shield,
    Globe,
    Users,
    Loader2,
    Save,
    Eye,
    EyeOff,
    Check,
    X,
    Clock,
    ChefHat,
    UserCog,
    Package,
    Sparkles
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

// Count-up animation hook
const useCountUp = (end: number, duration: number = 1000, startOnMount: boolean = true) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (!startOnMount || hasStarted) return;
        setHasStarted(true);

        let startTime: number;
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration, startOnMount, hasStarted]);

    return count;
};



interface PasswordStrengthBarProps {
    password: string;
}

const PasswordStrengthBar = ({ password }: PasswordStrengthBarProps) => {
    const getStrength = () => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const strength = getStrength();
    const percentage = (strength / 5) * 100;

    const getColor = () => {
        if (strength <= 1) return 'bg-red-500';
        if (strength <= 2) return 'bg-orange-500';
        if (strength <= 3) return 'bg-yellow-500';
        if (strength <= 4) return 'bg-lime-500';
        return 'bg-green-500';
    };

    const getLabel = () => {
        if (strength <= 1) return 'Weak';
        if (strength <= 2) return 'Fair';
        if (strength <= 3) return 'Good';
        if (strength <= 4) return 'Strong';
        return 'Very Strong';
    };

    if (!password) return null;

    return (
        <div className="space-y-1.5 mt-2">
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Password Strength</span>
                <span className={`text-xs font-medium ${strength <= 2 ? 'text-red-500' : strength <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {getLabel()}
                </span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ease-out ${getColor()}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

interface AnimatedStatCardProps {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    delay?: number;
}

const AnimatedStatCard = ({ label, value, icon: Icon, color, delay = 0 }: AnimatedStatCardProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const animatedValue = useCountUp(isVisible ? value : 0, 1000, isVisible);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={`${color} rounded-lg p-4 text-center border transform transition-all duration-500 hover:scale-105 hover:shadow-lg cursor-default ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <Icon className="h-6 w-6 mx-auto mb-2 opacity-70 transition-transform duration-300 group-hover:scale-110" />
            <div className="text-2xl font-bold tabular-nums">{animatedValue}</div>
            <div className="text-xs opacity-80">{label}</div>
        </div>
    );
};

// Tabs are now defined dynamically inside the component to use translations
// or we can use keys here and translate during render
const TAB_IDS = ['general', 'staff', 'security', 'localization'] as const;
type TabId = typeof TAB_IDS[number];

const CURRENCIES = [
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
    { value: 'CHF', label: 'Swiss Franc (CHF)', symbol: 'CHF' },
    { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' }
];

const TIMEZONES = [
    { value: 'Europe/Vienna', label: 'Vienna (GMT+1)' },
    { value: 'Europe/Berlin', label: 'Berlin (GMT+1)' },
    { value: 'Europe/Zurich', label: 'Zurich (GMT+1)' },
    { value: 'Europe/London', label: 'London (GMT+0)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' }
];

const SettingsPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pageLoaded, setPageLoaded] = useState(false);

    const [settings, setSettings] = useState<RestaurantSettings>({
        name: '',
        address: '',
        phone: '',
        email: '',
        currency: 'EUR',
        timezone: 'Europe/Vienna'
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        fetchSettings();
        // Page fade-in animation
        setTimeout(() => setPageLoaded(true), 100);
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const data = await settingsService.getSettings();
            setSettings(data);
        } catch (error: any) {

        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingsChange = (field: keyof RestaurantSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await settingsService.updateSettings(settings);
            toast.success(t('staff.toast.save_success'), {
                icon: <Sparkles className="h-4 w-4 text-green-500" />
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        if (password.length < 8) errors.push('min8');
        if (!/[A-Z]/.test(password)) errors.push('uppercase');
        if (!/[a-z]/.test(password)) errors.push('lowercase');
        if (!/[0-9]/.test(password)) errors.push('number');
        return errors;
    };

    const handlePasswordChange = (field: keyof typeof passwordForm, value: string) => {
        setPasswordForm(prev => ({ ...prev, [field]: value }));
        if (field === 'newPassword') {
            setPasswordErrors(validatePassword(value));
        }
    };

    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword) {
            toast.error('Please enter your current password');
            return;
        }
        if (passwordErrors.length > 0) {
            toast.error('Please fix password requirements');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsChangingPassword(true);
        try {
            await settingsService.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            toast.success('Password changed successfully! 🎉');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordErrors([]);
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralTab settings={settings} onChange={handleSettingsChange} onSave={handleSaveSettings} isSaving={isSaving} />;
            case 'staff':
                return <StaffTab />;
            case 'security':
                return <SecurityTab
                    passwordForm={passwordForm}
                    showPasswords={showPasswords}
                    passwordErrors={passwordErrors}
                    isChangingPassword={isChangingPassword}
                    onPasswordChange={handlePasswordChange}
                    onTogglePassword={(field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))}
                    onSubmit={handleChangePassword}
                />;
            case 'localization':
                return <LocalizationTab settings={settings} onChange={handleSettingsChange} onSave={handleSaveSettings} isSaving={isSaving} />;
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'general', label: t('settings.tabs.general'), icon: Building2 },
        { id: 'staff', label: t('settings.tabs.staff'), icon: Users, adminOnly: true },
        { id: 'security', label: t('settings.tabs.security'), icon: Shield },
        { id: 'localization', label: t('settings.tabs.localization'), icon: Globe }
    ];

    const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6 pb-20">
                <div className="animate-pulse">
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                </div>
                <div className="grid gap-6">
                    <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 pb-20 transition-all duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {/* Page Header */}
            <PageHeader
                title={t('settings.title')}
                description={t('settings.description')}
            />

            {/* Main Content Grid */}
            <div className="grid gap-6">
                {/* Navigation Tabs Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg overflow-x-auto w-full sm:w-auto scrollbar-hide">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabId)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md whitespace-nowrap transition-all duration-300 text-sm font-medium ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-[#16213e] dark:text-white shadow-sm ring-1 ring-[#16213e]/20 dark:ring-slate-600'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-[#16213e] dark:text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content Area */}
                <div className="transition-all duration-300 ease-in-out">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

interface GeneralTabProps {
    settings: RestaurantSettings;
    onChange: (field: keyof RestaurantSettings, value: string) => void;
    onSave: () => void;
    isSaving: boolean;
}

const GeneralTab = ({ settings, onChange, onSave, isSaving }: GeneralTabProps) => {
    const { t } = useTranslation();
    const [focusedField, setFocusedField] = useState<string | null>(null);

    return (
        <Card className="relative border border-purple-100/50 dark:border-slate-700 bg-purple-50/60 dark:bg-slate-900/60 shadow-lg overflow-hidden rounded-xl transition-all duration-500 ring-1 ring-slate-900/5 shadow-[#16213e]/5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
            <div className="h-1 w-full bg-gradient-to-r from-[#16213e] via-[#1c2b50] to-[#16213e] relative z-20" />
            <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <div className="p-2 bg-blue-50/50 dark:bg-slate-700/50 rounded-lg">
                        <Building2 className="h-5 w-5 text-[#16213e]" />
                    </div>
                    {t('settings.general.title')}
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                    {t('settings.general.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-2 relative z-10">
                        <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-medium">{t('settings.general.name')}</Label>
                        <div className={`relative transition-all duration-300 transform ${focusedField === 'name' ? 'scale-[1.01]' : ''}`}>
                            <Input
                                id="name"
                                value={settings.name}
                                onChange={(e) => onChange('name', e.target.value)}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                placeholder={t('settings.general.name_placeholder')}
                                className="h-11 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-600 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[#16213e] focus:ring-2 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="sm:col-span-2 space-y-2 relative z-10">
                        <Label htmlFor="address" className="text-slate-700 dark:text-slate-300 font-medium">{t('settings.general.address')}</Label>
                        <div className={`relative transition-all duration-300 transform ${focusedField === 'address' ? 'scale-[1.01]' : ''}`}>
                            <Input
                                id="address"
                                value={settings.address}
                                onChange={(e) => onChange('address', e.target.value)}
                                onFocus={() => setFocusedField('address')}
                                onBlur={() => setFocusedField(null)}
                                placeholder={t('settings.general.address_placeholder')}
                                className="h-11 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-600 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[#16213e] focus:ring-2 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2 relative z-10">
                        <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">{t('settings.general.phone')}</Label>
                        <div className={`relative transition-all duration-300 transform ${focusedField === 'phone' ? 'scale-[1.01]' : ''}`}>
                            <Input
                                id="phone"
                                type="tel"
                                value={settings.phone}
                                onChange={(e) => onChange('phone', e.target.value)}
                                onFocus={() => setFocusedField('phone')}
                                onBlur={() => setFocusedField(null)}
                                placeholder={t('settings.general.phone_placeholder')}
                                className="h-11 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-600 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[#16213e] focus:ring-2 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2 relative z-10">
                        <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">{t('settings.general.email')}</Label>
                        <div className={`relative transition-all duration-300 transform ${focusedField === 'email' ? 'scale-[1.01]' : ''}`}>
                            <Input
                                id="email"
                                type="email"
                                value={settings.email}
                                onChange={(e) => onChange('email', e.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                placeholder={t('settings.general.email_placeholder')}
                                className="h-11 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-600 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[#16213e] focus:ring-2 focus-visible:ring-offset-0"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700 relative z-10">
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="bg-[#16213e] hover:bg-[#1c2b50] text-white shadow-md hover:shadow-lg transition-all duration-300 h-11 px-6 rounded-lg font-bold"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('settings.general.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {t('settings.general.save')}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent >
        </Card >
    );
};

const StaffTab = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const data = await userService.getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            // silently fail - stats are non-critical
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const stats = [
        { label: t('staff.form.roles.ADMIN'), value: users.filter(u => u.role === 'ADMIN').length, icon: UserCog, color: 'bg-purple-50/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100/50 dark:border-purple-800/50' },
        { label: t('staff.form.roles.CHEF'), value: users.filter(u => u.role === 'CHEF').length, icon: ChefHat, color: 'bg-indigo-50/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100/50 dark:border-indigo-800/50' },
        { label: t('staff.form.roles.WAITER'), value: users.filter(u => u.role === 'WAITER').length, icon: Users, color: 'bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100/50 dark:border-emerald-800/50' },
        { label: t('staff.form.roles.INVENTORY_MANAGER'), value: users.filter(u => u.role === 'INVENTORY_MANAGER').length, icon: Package, color: 'bg-amber-50/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100/50 dark:border-amber-800/50' }
    ];

    return (
        <Card className="relative border border-purple-100/50 dark:border-slate-700 bg-purple-50/60 dark:bg-slate-900/60 shadow-lg overflow-hidden rounded-xl transition-all duration-500 ring-1 ring-slate-900/5 shadow-[#16213e]/5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
            <div className="h-1 w-full bg-gradient-to-r from-[#16213e] via-[#1c2b50] to-[#16213e] relative z-20" />
            <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <div className="p-2 bg-blue-50/50 dark:bg-slate-700/50 rounded-lg">
                        <Users className="h-5 w-5 text-[#16213e]" />
                    </div>
                    {t('settings.tabs.staff')}
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">{t('staff.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-purple-100/30 dark:border-slate-700/30 rounded-xl p-8 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-purple-100/10 dark:from-slate-800/40 dark:to-slate-700/10 pointer-events-none" />
                    <div className="bg-white dark:bg-slate-700 p-4 rounded-full w-20 h-20 mx-auto mb-4 shadow-sm flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                        <Users className="h-10 w-10 text-[#16213e] dark:text-purple-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 relative z-10">{t('settings.staff_portal.title')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto relative z-10">
                        {t('settings.staff_portal.description')}
                    </p>
                    <Button
                        onClick={() => navigate('/staff')}
                        className="bg-[#16213e] hover:bg-[#1c2b50] text-white shadow-md hover:shadow-lg transition-all h-11 px-8 rounded-lg font-bold relative z-10"
                    >
                        <Users className="mr-2 h-4 w-4" />
                        {t('settings.staff_portal.action')}
                    </Button>
                </div>

                <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Quick Stats</h4>
                    {isLoadingUsers ? (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            {stats.map((stat, index) => (
                                <AnimatedStatCard
                                    key={stat.label}
                                    label={stat.label}
                                    value={stat.value}
                                    icon={stat.icon}
                                    color={stat.color}
                                    delay={index * 100}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

interface SecurityTabProps {
    passwordForm: { currentPassword: string; newPassword: string; confirmPassword: string };
    showPasswords: { current: boolean; new: boolean; confirm: boolean };
    passwordErrors: string[];
    isChangingPassword: boolean;
    onPasswordChange: (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => void;
    onTogglePassword: (field: 'current' | 'new' | 'confirm') => void;
    onSubmit: () => void;
}

const SecurityTab = ({
    passwordForm, showPasswords, passwordErrors, isChangingPassword,
    onPasswordChange, onTogglePassword, onSubmit
}: SecurityTabProps) => {
    const { t } = useTranslation();
    const passwordsMatch = passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword !== '';
    const passwordsDoNotMatch = passwordForm.confirmPassword !== '' && !passwordsMatch;

    const requirements = [
        { id: 'min8', text: 'At least 8 characters', valid: passwordForm.newPassword.length >= 8 },
        { id: 'uppercase', text: 'One uppercase letter', valid: /[A-Z]/.test(passwordForm.newPassword) },
        { id: 'lowercase', text: 'One lowercase letter', valid: /[a-z]/.test(passwordForm.newPassword) },
        { id: 'number', text: 'One number', valid: /[0-9]/.test(passwordForm.newPassword) }
    ];

    return (
        <Card className="relative border border-purple-100/50 dark:border-slate-700 bg-purple-50/60 dark:bg-slate-900/60 shadow-lg overflow-hidden rounded-xl transition-all duration-500 ring-1 ring-slate-900/5 shadow-[#16213e]/5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
            <div className="h-1 w-full bg-gradient-to-r from-[#16213e] via-[#1c2b50] to-[#16213e] relative z-20" />
            <CardHeader className="relative z-10 border-b border-slate-100 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <div className="p-2 bg-blue-50/50 dark:bg-slate-700/50 rounded-lg">
                        <Shield className="h-5 w-5 text-[#16213e]" />
                    </div>
                    {t('settings.security.title')}
                </CardTitle>
                <CardDescription className="text-slate-500">{t('settings.security.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="space-y-4 max-w-2xl">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Change Password</h4>

                    {/* Current Password */}
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-slate-700 dark:text-slate-300 font-medium">{t('settings.security.current_password')}</Label>
                        <div className="relative group">
                            <Input
                                id="currentPassword"
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordForm.currentPassword}
                                onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
                                placeholder={t('settings.security.current_password_placeholder')}
                                className="pr-10 h-11 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-600 transition-all focus:bg-white dark:focus:bg-slate-800 focus:ring-[#16213e] focus:ring-2 focus-visible:ring-offset-0"
                            />
                            <button
                                type="button"
                                onClick={() => onTogglePassword('current')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-[#16213e] dark:hover:text-slate-200 transition-colors"
                            >
                                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300 font-medium">{t('settings.security.new_password')}</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => onPasswordChange('newPassword', e.target.value)}
                                placeholder={t('settings.security.new_password_placeholder')}
                                className="pr-10 h-11 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-600 transition-all focus:bg-white dark:focus:bg-slate-800 focus:ring-[#16213e] focus:ring-2 focus-visible:ring-offset-0"
                            />
                            <button
                                type="button"
                                onClick={() => onTogglePassword('new')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-[#16213e] dark:hover:text-slate-200 transition-colors"
                            >
                                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Password Strength Bar */}
                        <PasswordStrengthBar password={passwordForm.newPassword} />

                        {/* Requirements with animation */}
                        {passwordForm.newPassword && (
                            <div className="mt-3 space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                {requirements.map((req, index) => (
                                    <div
                                        key={req.id}
                                        className={`flex items-center gap-2 text-sm transition-all duration-300 ${req.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
                                        style={{ transitionDelay: `${index * 50}ms` }}
                                    >
                                        <div className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-300 ${req.valid ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                            {req.valid ? (
                                                <Check className="h-3 w-3 text-emerald-600" />
                                            ) : (
                                                <X className="h-3 w-3 text-slate-400" />
                                            )}
                                        </div>
                                        <span className={`transition-all duration-300 ${req.valid ? 'line-through opacity-60' : ''}`}>
                                            {req.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300 font-medium">{t('settings.security.confirm_password')}</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
                                placeholder={t('settings.security.confirm_password_placeholder')}
                                className={`pr-10 h-11 transition-all focus:ring-2 focus-visible:ring-offset-0 ${passwordsDoNotMatch
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50 backdrop-blur-sm'
                                    : passwordsMatch
                                        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-emerald-50/30 backdrop-blur-sm'
                                        : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-[#16213e]'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => onTogglePassword('confirm')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-[#16213e] dark:hover:text-slate-200 transition-colors"
                            >
                                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordsDoNotMatch && (
                            <p className="text-sm text-red-500 flex items-center gap-1 animate-pulse">
                                <X className="h-3.5 w-3.5" /> Passwords do not match
                            </p>
                        )}
                        {passwordsMatch && (
                            <p className="text-sm text-emerald-600 flex items-center gap-1">
                                <Check className="h-3.5 w-3.5 animate-bounce" /> Passwords match
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                    <Button
                        onClick={onSubmit}
                        disabled={isChangingPassword || passwordErrors.length > 0 || !passwordsMatch || !passwordForm.currentPassword}
                        className="bg-[#16213e] hover:bg-[#1c2b50] text-white disabled:opacity-50 transition-all duration-300 h-11 px-6 rounded-lg shadow-md hover:shadow-lg font-bold"
                    >
                        {isChangingPassword ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Changing Password...
                            </>
                        ) : (
                            <>
                                <Shield className="mr-2 h-4 w-4" />
                                Change Password
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

interface LocalizationTabProps {
    settings: RestaurantSettings;
    onChange: (field: keyof RestaurantSettings, value: string) => void;
    onSave: () => void;
    isSaving: boolean;
}

const LocalizationTab = ({ settings, onChange, onSave, isSaving }: LocalizationTabProps) => {
    const { t } = useTranslation();

    return (
        <Card className="relative border border-purple-100/50 dark:border-slate-700 bg-purple-50/60 dark:bg-slate-900/60 shadow-lg overflow-hidden rounded-xl ring-1 ring-slate-900/5 shadow-blue-900/5 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
            <div className="h-1 w-full bg-gradient-to-r from-[#16213e] via-[#1c2b50] to-[#16213e] relative z-20" />
            <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <div className="p-2 bg-blue-50 dark:bg-slate-700/50 rounded-lg">
                        <Globe className="h-5 w-5 text-[#16213e]" />
                    </div>
                    {t('settings.localization.title')}
                </CardTitle>
                <CardDescription>{t('settings.localization.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Currency */}
                    <div className="space-y-2 group">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium">{t('settings.localization.currency')}</Label>
                        <Select value={settings.currency} onValueChange={(value) => onChange('currency', value)}>
                            <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[#16213e] focus:ring-2 disabled:opacity-50">
                                <SelectValue placeholder={t('settings.localization.select_currency')} />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map(currency => (
                                    <SelectItem key={currency.value} value={currency.value} className="cursor-pointer">
                                        <span className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{currency.symbol}</span>
                                            {currency.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.localization.currency_help')}</p>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2 group">
                        <Label className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Timezone
                        </Label>
                        <Select value={settings.timezone} onValueChange={(value) => onChange('timezone', value)}>
                            <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[#7C3176] focus:ring-2 disabled:opacity-50">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONES.map(tz => (
                                    <SelectItem key={tz.value} value={tz.value} className="cursor-pointer">
                                        {tz.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.localization.timezone_help')}</p>
                    </div>
                </div>

                {/* Preview Card with animation */}
                <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 hover:shadow-md">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#7C3176]" />
                        {t('settings.localization.preview')}
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 text-sm">
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                            <span className="text-slate-500 dark:text-slate-400">{t('settings.localization.currency_example')}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-600 font-mono">
                                {CURRENCIES.find(c => c.value === settings.currency)?.symbol}1,234.56
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                            <span className="text-slate-500 dark:text-slate-400">{t('settings.localization.timezone')}</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                                {TIMEZONES.find(tz => tz.value === settings.timezone)?.label}
                            </span>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="bg-[#16213e] hover:bg-[#1c2b50] text-white shadow-md hover:shadow-lg transition-all duration-300 h-11 px-6 rounded-lg font-bold"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('settings.localization.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {t('settings.localization.save')}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default SettingsPage;
