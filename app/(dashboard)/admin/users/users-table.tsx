'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus, Shield, ShieldAlert, Ban, Trash2, History, RotateCcw, Database } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    toggleBlockUser,
    toggleUserRole,
    deleteUser,
    createUser,
    deleteUserData,
    deleteUserHistory,
    resetUserProgress
} from './actions';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

type User = {
    id: string;
    name: string | null;
    email: string;
    role: 'user' | 'admin';
    isBlocked: boolean;
    createdAt: Date;
};

export function UsersTable({ users }: { users: User[] }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Stan dla okien dialogowych
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Stan formularza tworzenia (bez hasła - logowanie przez SSO)
    const [newUser, setNewUser] = useState<{
        name: string;
        email: string;
        role: 'user' | 'admin';
    }>({ name: '', email: '', role: 'user' });

    const handleAction = async (action: () => Promise<void>) => {
        setIsLoading(true);
        try {
            await action();
            router.refresh();
        } catch (error) {
            console.error('Wystąpił błąd:', error);
            toast.error('Wystąpił błąd');
        } finally {
            setIsLoading(false);
            closeAll();
        }
    };

    const closeAll = () => {
        setIsCreateOpen(false);
        setIsDeleteOpen(false);
        setSelectedUser(null);
        setNewUser({ name: '', email: '', role: 'user' });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Użytkownicy</h2>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Dodaj użytkownika
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-black">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Użytkownik</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rola</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name || 'Bez nazwy'}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.isBlocked ? (
                                        <Badge variant="destructive">Zablokowany</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-green-600 border-green-600">Aktywny</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Otwórz menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleAction(() => toggleUserRole(user.id, user.role))}>
                                                {user.role === 'admin' ? (
                                                    <><ShieldAlert className="mr-2 h-4 w-4" /> Degraduj do User</>
                                                ) : (
                                                    <><Shield className="mr-2 h-4 w-4" /> Awansuj na Admin</>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAction(() => toggleBlockUser(user.id, user.isBlocked))}>
                                                <Ban className="mr-2 h-4 w-4" /> {user.isBlocked ? 'Odblokuj' : 'Zablokuj'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Zarządzanie danymi</DropdownMenuLabel>
                                            <DropdownMenuItem className="text-orange-600" onClick={async () => {
                                                try {
                                                    await deleteUserHistory(user.id);
                                                    toast.success('Historia użytkownika została usunięta');
                                                    router.refresh();
                                                } catch (error) {
                                                    toast.error('Nie udało się usunąć historii');
                                                }
                                            }}>
                                                <History className="mr-2 h-4 w-4" /> Usuń historię
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-yellow-600" onClick={async () => {
                                                try {
                                                    await resetUserProgress(user.id);
                                                    toast.success('Postępy użytkownika zostały zresetowane');
                                                    router.refresh();
                                                } catch (error) {
                                                    toast.error('Nie udało się zresetować postępów');
                                                }
                                            }}>
                                                <RotateCcw className="mr-2 h-4 w-4" /> Resetuj postępy
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={async () => {
                                                try {
                                                    await deleteUserData(user.id);
                                                    toast.success('Wszystkie dane użytkownika zostały usunięte');
                                                    router.refresh();
                                                } catch (error) {
                                                    toast.error('Nie udało się usunąć danych');
                                                }
                                            }}>
                                                <Database className="mr-2 h-4 w-4" /> Usuń wszystkie dane
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Usuń użytkownika
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Panel tworzenia użytkownika */}
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Dodaj nowego użytkownika</SheetTitle>
                        <SheetDescription>
                            Utwórz nowe konto użytkownika. Użytkownik będzie mógł się zalogować
                            przez Centrum Logowania.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Użytkownik musi posiadać konto w Centrum Logowania z tym samym adresem email,
                                aby móc się zalogować do tej aplikacji.
                            </AlertDescription>
                        </Alert>
                        <Field>
                            <FieldLabel>Nazwa</FieldLabel>
                            <Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                        </Field>
                        <Field>
                            <FieldLabel>Email</FieldLabel>
                            <Input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                        </Field>
                        <Field>
                            <FieldLabel>Rola</FieldLabel>
                            <Select value={newUser.role} onValueChange={(v: 'user' | 'admin') => setNewUser({ ...newUser, role: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                    <SheetFooter>
                        <Button onClick={() => handleAction(() => createUser(newUser))} disabled={!newUser.email || isLoading}>
                            {isLoading ? 'Tworzenie...' : 'Utwórz'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Potwierdzenie usuwania */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno chcesz usunąć tego użytkownika?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tej operacji nie można cofnąć. Użytkownik {selectedUser?.email} zostanie trwale usunięty.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (selectedUser) handleAction(() => deleteUser(selectedUser.id)); }}>
                            {isLoading ? 'Usuwanie...' : 'Usuń'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
