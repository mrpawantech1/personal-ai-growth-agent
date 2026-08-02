'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 h-full w-full bg-gradient-to-r from-primary/10 to-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 h-full w-full bg-gradient-to-l from-primary/10 to-purple-500/10 blur-3xl" />
      </div>

      <div className="glass w-full max-w-lg animate-fade-in rounded-2xl p-8 text-center">
        {/* 404 Graphic */}
        <div className="mb-6">
          <div className="text-8xl font-bold tracking-tighter">
            <span className="gradient-text">404</span>
          </div>
          <div className="mt-2 h-1 w-16 mx-auto rounded-full bg-gradient-to-r from-primary to-purple-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">Page Not Found</h1>
        <p className="mb-6 text-muted-foreground">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => router.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Link href="/">
            <Button className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-xs text-muted-foreground">
            Need help? Contact support or check your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
