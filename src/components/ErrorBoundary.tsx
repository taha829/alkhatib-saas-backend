import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground" dir="rtl">
                    <div className="p-4 rounded-full bg-destructive/10 mb-4">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">عذراً، حدث خطأ غير متوقع</h1>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                        {this.state.error?.message || "حدث خطأ أثناء تشغيل التطبيق"}
                    </p>
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.reload()} variant="default">
                            إعادة تحميل التطبيق
                        </Button>
                        <Button onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }} variant="outline">
                            مسح البيانات وإعادة التحميل
                        </Button>
                    </div>
                    <div className="mt-8 p-4 bg-secondary/50 rounded-lg text-left text-xs font-mono overflow-auto max-w-2xl max-h-64 border border-border">
                        {this.state.error?.stack}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
