import { Suspense, lazy, useEffect, useState } from "react";

const WashaDevStudio = lazy(() =>
  import("./dev/WashaDevStudio").then((m) => ({ default: m.WashaDevStudio })),
);
const WashaProductionStudio = lazy(() =>
  import("./prod/WashaProductionStudio").then((m) => ({ default: m.WashaProductionStudio })),
);
const SpaceAtlasApp = lazy(() =>
  import("./space/SpaceAtlasApp").then((m) => ({ default: m.SpaceAtlasApp })),
);

export const ROUTES = {
  prod: "/design/washa-ai/app",
  dev: "/design/washa-ai/dev",
} as const;

type Route = "dev" | "prod" | "space";

function resolveRoute(pathname: string): Route {
  if (pathname.startsWith(ROUTES.dev)) return "dev";
  if (pathname.startsWith(ROUTES.prod)) return "prod";
  return "space";
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => resolveRoute(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(resolveRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (route !== "space") document.title = "وشى — استوديو التصميم";
  }, [route]);

  return (
    <Suspense fallback={null}>
      {route === "dev" ? <WashaDevStudio /> : route === "prod" ? <WashaProductionStudio /> : <SpaceAtlasApp />}
    </Suspense>
  );
}
