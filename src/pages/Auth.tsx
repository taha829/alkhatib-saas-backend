import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toastWithSound } from '@/lib/toast-with-sound';
import { Loader2 } from "lucide-react";
import { authSchema } from "@/lib/validations";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate with Zod
      const validationData = isLogin
        ? { email, password }
        : { email, password, name: fullName };

      const validation = authSchema.safeParse(validationData);

      if (!validation.success) {
        toastWithSound.error(validation.error.errors[0].message);
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.includes("Invalid credentials") || error.includes("401")) {
            toastWithSound.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
          } else {
            toastWithSound.error(error);
          }
        } else {
          toastWithSound.success("تم تسجيل الدخول بنجاح");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.includes("already exists") || error.includes("400")) {
            toastWithSound.error("هذا البريد الإلكتروني مسجل مسبقاً");
          } else {
            toastWithSound.error(error);
          }
        } else {
          toastWithSound.success("تم إنشاء الحساب بنجاح");
          navigate("/");
        }
      }
    } catch (error) {
      toastWithSound.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md p-8 gradient-card border-border/50 shadow-elevated animate-scale-in">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <img src="./logo.png" alt="Logo" className="h-20 w-20 rounded-2xl shadow-glow animate-bounce-slow" />
          <div className="text-center">
            <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-orange-500 to-secondary bg-clip-text text-transparent drop-shadow-sm mb-2" style={{ textShadow: '4px 4px 8px rgba(212, 100, 48, 0.2)' }}>
              AL-Khatib
            </h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Marketing & Software</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-center mb-6">
          {isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="bg-secondary/50 border-border/50"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل بريدك الإلكتروني"
              required
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              required
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : null}
            {isLogin ? "تسجيل الدخول" : "إنشاء الحساب"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary-glow transition-colors text-sm"
          >
            {isLogin ? "ليس لديك حساب؟ أنشئ حساباً جديداً" : "لديك حساب؟ سجل الدخول"}
          </button>
        </div>
      </Card >
    </div >
  );
};

export default Auth;
