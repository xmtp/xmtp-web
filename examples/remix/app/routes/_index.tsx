import rainbowKitStyles from "@rainbow-me/rainbowkit/styles.css?url";
import reactAppStyles from "@xmtp/react-app/styles.css?url";
import { LinksFunction, type MetaFunction } from "@remix-run/node";
import { StrictMode } from "react";
import { App } from "@xmtp/react-app";
import { ClientOnly } from "remix-utils/client-only";

export const meta: MetaFunction = () => {
  return [
    { title: "XMTP Remix example" },
    { name: "description", content: "XMTP chat app using Remix." },
  ];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: rainbowKitStyles },
  { rel: "stylesheet", href: reactAppStyles },
];

export default function Index() {
  return (
    <StrictMode>
      <ClientOnly fallback={<div>Loading...</div>}>{() => <App />}</ClientOnly>
    </StrictMode>
  );
}
