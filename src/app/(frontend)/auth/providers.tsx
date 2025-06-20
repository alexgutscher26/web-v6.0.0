"use client";

import { authClient } from "@/server/auth/client";
import { api } from "@/trpc/react";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { useRouter } from "next/navigation";
import { SOCIAL_PROVIDERS } from "@/utils/schema/settings";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: providers = [] } = api.settings.socialAuthProviders.useQuery();

  // Filter and cast to the correct union type, without using 'any'
  const safeProviders = providers.filter((p): p is (typeof SOCIAL_PROVIDERS)[number] =>
    (SOCIAL_PROVIDERS as readonly string[]).includes(p)
  );

  return (
    <AuthUIProviderTanstack
      authClient={authClient}
      rememberMe={true}
      {...(safeProviders.length > 0 && { providers: safeProviders })}
      navigate={(href: string) => router.push(href)}
      persistClient={false}
      replace={(href: string) => router.replace(href)}
      onSessionChange={() => router.refresh()}
    >
      {children}
    </AuthUIProviderTanstack>
  );
}
