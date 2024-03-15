import { LinksFunction, LoaderFunction, json } from "@remix-run/node";
import globalStyles from "./globals.css?url";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { Buffer } from "buffer";
import { useMemo } from "react";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet } from "@wagmi/core/chains";
import { http } from "@wagmi/core";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

globalThis.Buffer = globalThis.Buffer ?? Buffer;

type LoaderData = {
  ENV: {
    PROJECT_ID: string;
  };
};

const queryClient = new QueryClient();

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: globalStyles },
];

export const loader: LoaderFunction = () => {
  const data: LoaderData = {
    ENV: {
      PROJECT_ID: process.env.PROJECT_ID || "",
    },
  };

  return json(data);
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { ENV } = useLoaderData<LoaderData>();
  const config = useMemo(() => {
    return getDefaultConfig({
      appName: "XMTP Next.js Example",
      projectId: ENV.PROJECT_ID,
      chains: [mainnet],
      transports: {
        [mainnet.id]: http(),
      },
      ssr: true,
    });
  }, []);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="root">
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider>{children}</RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
