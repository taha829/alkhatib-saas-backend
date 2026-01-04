import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Loader2, ArrowRight, X, Image as ImageIcon, FileText, Video, Tag, Check, Plus } from 'lucide-react';
import { toastWithSound } from '@/lib/toast-with-sound';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { whatsappApi, BASE_URL } from '@/lib/api';

interface Message {
    id: number;
    content: string;
    from_me: boolean;
    timestamp: string;
}

interface TagType {
    id: number;
    name: string;
    color: string;
}

interface WhatsAppChatProps {
    chat: any;
    onBack: () => void;
}

export default function WhatsAppChat({ chat, onBack }: WhatsAppChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ url: string; type: string; name: string } | null>(null);
    const [allTags, setAllTags] = useState<TagType[]>([]);
    const [contactTags, setContactTags] = useState<TagType[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadMessages();
        loadTags();
        const interval = setInterval(loadMessages, 5000); // Poll for new messages
        return () => clearInterval(interval);
    }, [chat.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadTags = async () => {
        try {
            // Load all tags
            const allData = await whatsappApi.getTags();
            setAllTags(Array.isArray(allData) ? allData : []);

            // Load contact's tags
            const contactData = await whatsappApi.getContactTags(chat.phone);
            setContactTags(Array.isArray(contactData) ? contactData : []);
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    };

    const toggleTag = async (tag: TagType) => {
        const isTagged = contactTags.find(t => t.id === tag.id);

        try {
            if (isTagged) {
                await whatsappApi.removeContactTag(chat.phone, tag.id);
                setContactTags(prev => prev.filter(t => t.id !== tag.id));
            } else {
                await whatsappApi.addContactTag(chat.phone, tag.id);
                setContactTags(prev => [...prev, tag]);
            }
        } catch (error) {
            toastWithSound.error('فشل تحديث الوسوم');
        }
    };

    const loadMessages = async () => {
        // Skip for temporary (new) chats
        if (chat.isTemp) {
            setMessages([]);
            return;
        }

        try {
            const data = await whatsappApi.getMessages(chat.id);
            setMessages(Array.isArray(data) ? data : []);

            // Mark as read
            await whatsappApi.markRead(chat.id);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const data = await whatsappApi.upload(formData);
            if (data.url) {
                setSelectedFile({
                    url: data.url,
                    type: data.mimetype?.startsWith('image/') ? 'image' : data.mimetype?.startsWith('video/') ? 'video' : 'document',
                    name: data.filename
                });
            } else {
                toastWithSound.error('فشل رفع الملف');
            }
        } catch (error) {
            toastWithSound.error('خطأ في الاتصال أثناء الرفع');
        } finally {
            setUploading(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() && !selectedFile) return;

        setSending(true);
        try {
            await whatsappApi.send({
                phone: chat.phone,
                message: newMessage,
                mediaUrl: selectedFile?.url || undefined,
                mediaType: selectedFile?.type || undefined
            });

            setNewMessage('');
            setSelectedFile(null);
            loadMessages();
        } catch (error) {
            toastWithSound.error('خطأ في إرسال الرسالة');
        } finally {
            setSending(false);
        }
    };

    const isImageUrl = (url: string) => {
        if (!url) return false;
        return url.match(/\.(jpeg|jpg|gif|png)$/i) != null || (url.includes('/uploads/') && !url.includes('.mp4'));
    };

    return (
        <Card className="flex flex-col h-[650px] border-none shadow-2xl bg-muted/20 overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg leading-tight">{chat.name || chat.phone}</h3>
                            <div className="flex gap-1">
                                {contactTags.map(tag => (
                                    <Badge
                                        key={tag.id}
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4"
                                        style={{ borderColor: tag.color, color: tag.color }}
                                    >
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">متصل الآن</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                                <Tag className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold px-2 py-1 flex items-center gap-2 mb-1">
                                    <Tag className="h-3 w-3" /> تصنيف العميل
                                </h4>
                                {allTags.map(tag => {
                                    const isSelected = contactTags.find(t => t.id === tag.id);
                                    return (
                                        <Button
                                            key={tag.id}
                                            variant="ghost"
                                            className="w-full justify-between px-2 h-9 text-sm font-normal"
                                            onClick={() => toggleTag(tag)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                                {tag.name}
                                            </div>
                                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                                        </Button>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {(chat.name || String(chat.phone)).substring(0, 1).toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://w0.peakpx.com/wallpaper/580/650/HD-wallpaper-whatsapp-background-dark-whatsapp-theme-whatsapp-pattern.jpg')] bg-repeat opacity-90 shadow-inner"
                ref={scrollRef}
                style={{ backgroundSize: '400px' }}
            >
                {Array.isArray(messages) && messages.map((msg) => {
                    const contentStr = String(msg.content || '');
                    const isMedia = contentStr.includes('http') && isImageUrl(contentStr);
                    const mediaUrl = isMedia ? (contentStr.startsWith('http') ? contentStr : `${BASE_URL}${contentStr}`) : null;

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${msg.from_me ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div
                                className={`max-w-[75%] p-1.5 rounded-2xl shadow-md ${msg.from_me
                                    ? 'bg-primary text-primary-foreground rounded-tl-none'
                                    : 'bg-card text-foreground rounded-tr-none border border-border/40'
                                    }`}
                            >
                                {isMedia ? (
                                    <div className="overflow-hidden rounded-xl mb-1">
                                        <img src={mediaUrl || ''} alt="Media" className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />
                                    </div>
                                ) : (
                                    <p className="text-sm px-3 py-1.5 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                )}
                                <div className={`flex items-center justify-end gap-1 px-2 pb-1 ${msg.from_me ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    <span className="text-[9px] font-medium">
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                    {!msg.from_me && <span className="text-[10px] ml-1">✓✓</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preview Selected File */}
            {selectedFile && (
                <div className="px-4 py-2 bg-card border-t flex items-center justify-between animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                            {selectedFile.type === 'image' ? (
                                <img src={selectedFile.url.startsWith('http') ? selectedFile.url : `${BASE_URL}${selectedFile.url}`} alt="Preview" className="h-full w-full object-cover" />
                            ) : selectedFile.type === 'video' ? (
                                <Video className="h-6 w-6 text-primary" />
                            ) : (
                                <FileText className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{selectedFile.type}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-card/80 backdrop-blur-md border-t">
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,video/*,application/pdf"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                    </Button>
                    <Input
                        placeholder="اكتب رسالتك هنا..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
                        className="flex-1 bg-muted/50 border-none focus-visible:ring-1 rounded-full px-5 h-10"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={sending || (!newMessage.trim() && !selectedFile)}
                        size="icon"
                        className="gradient-primary rounded-full h-10 w-10 shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                    >
                        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
