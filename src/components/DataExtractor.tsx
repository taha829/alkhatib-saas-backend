import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataExtraction } from "@/hooks/useDataExtraction";
import {
  Link2,
  Loader2,
  Search,
  FileDown,
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Send,
  MessageCircle,
  Camera
} from "lucide-react";

const platforms = [
  { id: 'google', name: 'جوجل', icon: Search, color: 'text-blue-500' },
  { id: 'facebook', name: 'فيسبوك', icon: Facebook, color: 'text-blue-600' },
  { id: 'instagram', name: 'انستغرام', icon: Instagram, color: 'text-pink-600' },
  { id: 'twitter', name: 'تويتر / X', icon: Twitter, color: 'text-sky-500' },
  { id: 'linkedin', name: 'لينكد إن', icon: Linkedin, color: 'text-blue-700' },
  { id: 'tiktok', name: 'تيك توك', icon: Camera, color: 'text-foreground' },
  { id: 'youtube', name: 'يوتيوب', icon: Youtube, color: 'text-red-600' },
  { id: 'telegram', name: 'تيليجرام', icon: Send, color: 'text-sky-500' },
  { id: 'whatsapp', name: 'واتساب', icon: MessageCircle, color: 'text-green-600' },
];

const extractTypes = [
  { id: 'post', name: 'منشور' },
  { id: 'page', name: 'صفحة' },
  { id: 'group', name: 'مجموعة' },
  { id: 'profile', name: 'ملف شخصي' },
  { id: 'channel', name: 'قناة' },
  { id: 'video', name: 'فيديو' },
];

const DataExtractor = ({ variant = 'default' }: { variant?: 'default' | 'compact' }) => {
  const [url, setUrl] = useState("");
  /* State definitions restored */
  const { extractFromUrl, extractFromText, isExtracting } = useDataExtraction();
  const [platform, setPlatform] = useState("facebook");
  const [type, setType] = useState("post");
  const [text, setText] = useState("");
  const [lastResult, setLastResult] = useState<any>(null);

  const selectedPlatform = platforms.find(p => p.id === platform);
  const PlatformIcon = selectedPlatform?.icon || Search;

  // Handlers
  const handleExtractUrl = async () => {
    if (!url) return;
    const result = await extractFromUrl(url, platform, type);
    if (result) setLastResult(result);
  };

  const handleExtractText = async () => {
    if (!text) return;
    const result = await extractFromText(text, platform);
    if (result) setLastResult(result);
  };

  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        {/* Simplified compact view without outer Card */}
        <div className="space-y-4">
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {/* Same tabs ... */}
              <TabsTrigger value="url" className="flex items-center gap-2 text-xs">
                <Link2 className="h-3 w-3" />
                رابط
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2 text-xs">
                <MessageSquare className="h-3 w-3" />
                نص
              </TabsTrigger>
            </TabsList>

            {/* Content similar to main but maybe smaller padding */}
            <TabsContent value="url" className="space-y-3 mt-3">
              {/* ... Inputs ... */}
              <div className="space-y-2">
                <Label className="text-xs">المنصة</Label>
                <div className="grid grid-cols-4 gap-1">
                  {platforms.slice(0, 5).map((p) => {
                    const Icon = p.icon;
                    return (
                      <Button
                        key={p.id}
                        type="button"
                        variant={platform === p.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatform(p.id)}
                        className="h-8 px-0"
                      >
                        <Icon className={`h-3 w-3 ${platform === p.id ? '' : p.color}`} />
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="الرابط..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <Button
                onClick={handleExtractUrl}
                disabled={isExtracting || !url.trim()}
                className="w-full h-8 text-xs"
                size="sm"
              >
                {isExtracting ? <Loader2 className="h-3 w-3 animate-spin" /> : "استخراج"}
              </Button>
            </TabsContent>

            <TabsContent value="text" className="space-y-3 mt-3">
              <Textarea
                placeholder="نص..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-20 text-xs resize-none"
              />
              <Button
                onClick={handleExtractText}
                disabled={isExtracting || !text.trim()}
                className="w-full h-8 text-xs"
                size="sm"
              >
                استخراج
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Search className="h-5 w-5 text-primary" />
          استخراج البيانات
        </CardTitle>
        <CardDescription>
          استخرج أرقام الهواتف والبيانات من جميع منصات التواصل الاجتماعي
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              من رابط
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              من نص
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>اختر المنصة</Label>
              <div className="grid grid-cols-4 gap-2">
                {platforms.map((p) => {
                  const Icon = p.icon;
                  return (
                    <Button
                      key={p.id}
                      type="button"
                      variant={platform === p.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlatform(p.id)}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                    >
                      <Icon className={`h-4 w-4 ${platform === p.id ? '' : p.color}`} />
                      <span className="text-xs">{p.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url">رابط {selectedPlatform?.name}</Label>
              <div className="relative">
                <PlatformIcon className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${selectedPlatform?.color}`} />
                <Input
                  id="url"
                  placeholder={`https://${platform}.com/...`}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label>نوع المحتوى</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {extractTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleExtractUrl}
              disabled={isExtracting || !url.trim()}
              className="w-full"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الاستخراج...
                </>
              ) : (
                <>
                  <FileDown className="ml-2 h-4 w-4" />
                  استخراج من الرابط
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text">الصق النص هنا</Label>
              <Textarea
                id="text"
                placeholder="الصق هنا نص التعليقات أو المنشورات لاستخراج أرقام الهواتف منها..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>مصدر النص</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => {
                    const Icon = p.icon;
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${p.color}`} />
                          {p.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleExtractText}
              disabled={isExtracting || !text.trim()}
              className="w-full"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الاستخراج...
                </>
              ) : (
                <>
                  <Search className="ml-2 h-4 w-4" />
                  استخراج من النص
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {lastResult && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground mb-2">{lastResult.note}</p>
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-primary">
                تم استخراج {lastResult.data?.length || 0} جهة اتصال
              </p>
              {lastResult.duplicates > 0 && (
                <p className="text-sm text-muted-foreground">
                  ({lastResult.duplicates} مكرر)
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataExtractor;
