'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Eye, Trash2, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { markMessageAsRead, deleteContactMessage, type ContactMessage } from '../actions';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ContactMessagesCardProps {
    messages: ContactMessage[];
}

export function ContactMessagesCard({ messages }: ContactMessagesCardProps) {
    const [localMessages, setLocalMessages] = useState(messages);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const unreadCount = localMessages.filter(m => !m.isRead).length;

    async function handleMarkAsRead(messageId: string) {
        setLoadingId(messageId);
        const result = await markMessageAsRead(messageId);
        
        if (result.success) {
            setLocalMessages(prev => 
                prev.map(m => m.id === messageId ? { ...m, isRead: true } : m)
            );
            toast.success('Oznaczono jako przeczytane');
        } else {
            toast.error('Wystąpił błąd');
        }
        setLoadingId(null);
    }

    async function handleDelete(messageId: string) {
        if (!confirm('Czy na pewno chcesz usunąć tę wiadomość?')) return;
        
        setLoadingId(messageId);
        const result = await deleteContactMessage(messageId);
        
        if (result.success) {
            setLocalMessages(prev => prev.filter(m => m.id !== messageId));
            toast.success('Wiadomość została usunięta');
        } else {
            toast.error('Wystąpił błąd');
        }
        setLoadingId(null);
    }

    return (
        <Card className="lg:col-span-1">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-violet-500" />
                        Wiadomości kontaktowe
                    </CardTitle>
                    {unreadCount > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">
                            {unreadCount} nowych
                        </span>
                    )}
                </div>
                <CardDescription>
                    Przeglądaj wiadomości z formularza kontaktowego
                </CardDescription>
            </CardHeader>
            <CardContent>
                {localMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Brak wiadomości</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {localMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`p-4 rounded-lg border transition-colors ${
                                    msg.isRead 
                                        ? 'bg-muted/30' 
                                        : 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium truncate">
                                                {msg.firstName} {msg.lastName}
                                            </span>
                                            {!msg.isRead && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-violet-500 text-white rounded">
                                                    NOWA
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {msg.email}
                                            </span>
                                            {msg.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {msg.phone}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(msg.createdAt), { 
                                                addSuffix: true, 
                                                locale: pl 
                                            })}
                                            {msg.emailSent ? (
                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Email wysłany
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Email nie wysłany
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!msg.isRead && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleMarkAsRead(msg.id)}
                                                disabled={loadingId === msg.id}
                                            >
                                                {loadingId === msg.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(msg.id)}
                                            disabled={loadingId === msg.id}
                                        >
                                            {loadingId === msg.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Treść wiadomości */}
                                <div className="mt-3">
                                    <button
                                        onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                                        className="text-sm text-left w-full"
                                    >
                                        <p className={`text-muted-foreground ${
                                            expandedId === msg.id ? '' : 'line-clamp-2'
                                        }`}>
                                            {msg.message}
                                        </p>
                                        {msg.message.length > 100 && (
                                            <span className="text-xs text-violet-500 hover:underline mt-1 inline-block">
                                                {expandedId === msg.id ? 'Zwiń' : 'Rozwiń'}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

