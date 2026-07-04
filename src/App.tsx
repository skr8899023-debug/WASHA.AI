import { useEffect, useState } from "react";
import { WashaDevStudio } from "./dev/WashaDevStudio";
import { WashaProductionStudio } from "./prod/WashaProductionStudio";

export const ROUTES = {
  prod: "/design/washa-ai/app",
  dev: "/design/washa-ai/dev",
} as const;

function resolveRoute(pathname: string): "dev" | "prod" {
  if (pathname.startsWith(ROUTES.dev)) return "dev";
  return "prod";
}

export default function App() {
  const [route, setRoute] = useState<"dev" | "prod">(() => resolveRoute(window.location.pathname));

  useEffect(() => {
    // normalize bare "/" onto the production route without a reload
    if (!window.location.pathname.startsWith(ROUTES.prod) && !window.location.pathname.startsWith(ROUTES.dev)) {
      window.history.replaceState(null, "", ROUTES.prod);
    }
    const onPop = () => setRoute(resolveRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return route === "dev" ? <WashaDevStudio /> : <WashaProductionStudio />;
}
