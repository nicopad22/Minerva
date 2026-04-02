'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from './client';

const supabase = createClient();

export default function ClientInitializer() {
    const pathname = usePathname();
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const isLoginPage = pathname === "/login";
            const { data: { session } } = await supabase.auth.getSession();

            if (!session && !isLoginPage) {
                router.replace("/login");
            } else if (session && isLoginPage) {
                router.replace("/");
            }
            setChecked(true);
        };

        checkAuth();

        // Also react to auth state changes (e.g. session expiry)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const isLoginPage = pathname === "/login";
            if (!session && !isLoginPage) {
                router.replace("/login");
            }
        });

        return () => subscription.unsubscribe();
    }, [pathname, router]);

    return null;
}