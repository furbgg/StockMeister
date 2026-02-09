import { useEffect, useState, useMemo } from 'react';
import { userService, User } from '@/services/userService';
import StaffFormSheet from '@/components/staff/StaffFormSheet';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Users, Mail, Phone, CalendarClock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

type SortField = 'name' | 'role' | 'salary' | null;
type SortDirection = 'asc' | 'desc';

const StaffPage = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(t('staff.toast.load_fail'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddStaff = () => {
        setSelectedUser(null);
        setSheetOpen(true);
    };

    const handleEditStaff = (user: User) => {
        setSelectedUser(user);
        setSheetOpen(true);
    };

    const handleDeleteStaff = async (id: number) => {
        if (confirm(t('staff.delete_confirm'))) {
            try {
                await userService.deleteUser(id);
                toast.success(t('staff.toast.delete_success'));
                fetchUsers();
            } catch (error) {
                toast.error(t('staff.toast.delete_fail'));
            }
        }
    };

    const formatRole = (role: string) => {
        return role ? role.replace('_', ' ') : 'Unknown';
    };

    const getRoleBadgeColor = () => {
        return 'bg-blue-50 text-[#16213e] border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const processedUsers = useMemo(() => {
        let filtered = [...users];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(u =>
                (u.username?.toLowerCase().includes(lowerTerm)) ||
                (u.email?.toLowerCase().includes(lowerTerm)) ||
                (u.role?.toLowerCase().includes(lowerTerm))
            );
        }

        if (!sortField) return filtered;

        return filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'name':
                    comparison = (a.username || '').localeCompare(b.username || '');
                    break;
                case 'role':
                    comparison = (a.role || '').localeCompare(b.role || '');
                    break;
                case 'salary':
                    comparison = (a.salary || 0) - (b.salary || 0);
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [users, sortField, sortDirection, searchTerm]);

    const getSortLabel = () => {
        if (!sortField) return t('staff.sort_by');
        const labels: Record<SortField & string, string> = {
            name: t('staff.sort_options.name'),
            role: t('staff.sort_options.role'),
            salary: t('staff.sort_options.salary')
        };
        return `${labels[sortField]} ${sortDirection === 'asc' ? '↑' : '↓'}`;
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Section */}
            <PageHeader
                title={t('staff.title')}
                description={t('staff.description')}
            >
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleAddStaff}
                        className="bg-[#16213e] hover:bg-[#1c2b50] text-white shadow-sm hover:shadow-md transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('staff.add_staff')}
                    </Button>
                </div>
            </PageHeader>

            {/* Main Content Grid */}
            <div className="grid gap-6">
                {/* Controls Bar */}
                <div className="relative flex flex-col xl:flex-row gap-4 justify-between items-center bg-purple-50/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-xl border border-purple-100/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />

                    <div className="relative flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('staff.team_members')} ({users.length})</span>
                    </div>

                    <div className="relative flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Input
                                placeholder={t('staff.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 focus:bg-white focus:ring-2 focus:ring-[#16213e]/20 transition-all rounded-lg"
                            />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300">
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    {getSortLabel()}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleSort('name')}>
                                    <span className="flex items-center gap-2 w-full justify-between">
                                        {t('staff.sort_options.name')}
                                        {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSort('role')}>
                                    <span className="flex items-center gap-2 w-full justify-between">
                                        {t('staff.sort_options.role')}
                                        {sortField === 'role' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSort('salary')}>
                                    <span className="flex items-center gap-2 w-full justify-between">
                                        {t('staff.sort_options.salary')}
                                        {sortField === 'salary' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                                    </span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="relative border border-purple-100/50 dark:border-slate-700/50 bg-purple-50/60 dark:bg-slate-800/60 shadow-lg overflow-hidden rounded-xl ring-1 ring-slate-900/5 shadow-blue-900/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-purple-100/20 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-700/20 pointer-events-none" />
                    <div className="h-1 w-full bg-gradient-to-r from-[#16213e] via-[#1c2b50] to-[#16213e]" />
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(100vh-320px)] min-h-[500px]">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-b border-purple-100/20">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="w-[80px] pl-6 font-semibold text-[#16213e] dark:text-slate-300">ID</TableHead>
                                        <TableHead className="font-semibold text-[#16213e] dark:text-slate-300">{t('staff.username')}</TableHead>
                                        <TableHead className="font-semibold text-[#16213e] dark:text-slate-300">{t('staff.email')} / {t('staff.phone')}</TableHead>
                                        <TableHead className="font-semibold text-[#16213e] dark:text-slate-300">{t('staff.salary')}</TableHead>
                                        <TableHead className="font-semibold text-[#16213e] dark:text-slate-300">{t('staff.schedule')}</TableHead>
                                        <TableHead className="text-right pr-6 font-semibold text-[#16213e] dark:text-slate-300">{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-96 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16213e]"></div>
                                                    {t('staff.loading')}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : processedUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-96 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                                                    <Users className="h-12 w-12 text-slate-300" />
                                                    <p className="text-lg font-medium">{t('staff.no_staff')}</p>
                                                    <p className="text-sm text-slate-400">{t('staff.try_adjusting')}</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        processedUsers.map((user) => (
                                            <TableRow key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800">
                                                <TableCell className="pl-6 font-medium text-slate-400">
                                                    #{user.id}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                                                            <AvatarImage src={`https://ui-avatars.com/api/?name=${user.username}&background=random`} />
                                                            <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                                                {user.username?.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{user.username}</span>
                                                            <Badge variant="outline" className={cn("w-fit mt-1 px-1.5 py-0 h-5 text-[10px] font-medium border uppercase tracking-wide", getRoleBadgeColor())}>
                                                                {formatRole(user.role)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-sm">
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                            {user.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                            {user.phone || <span className="text-slate-300 italic">{t('staff.no_phone')}</span>}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                                                        <DollarSign className="h-4 w-4 text-[#16213e]" />
                                                        {user.salary ? user.salary.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                        <CalendarClock className="h-4 w-4 text-slate-400" />
                                                        {user.timings || <span className="text-slate-300 italic"> {t('staff.flexible')}</span>}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                            onClick={() => handleEditStaff(user)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            onClick={() => handleDeleteStaff(user.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <StaffFormSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                userToEdit={selectedUser}
                onUserSaved={fetchUsers}
            />
        </div>
    );
};

export default StaffPage;