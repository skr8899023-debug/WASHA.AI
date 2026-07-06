import { lazy, Suspense, useEffect, useState } from "react";
import { WashaDevStudio } from "./dev/WashaDevStudio";
import { WashaProductionStudio } from "./prod/WashaProductionStudio";

const ChemistryApp = lazy(() => import("./chem/ChemistryApp"));

export const ROUTES = {
  chemistry: "/",
  prod: "/design/washa-ai/app",
  dev: "/design/washa-ai/dev",
} as const;

type Route = "chemistry" | "dev" | "prod";

const TITLES: Record<Route, string> = {
  chemistry: "مختبر الكيمياء التفاعلي",
  prod: "وشى — استوديو التصميم",
  dev: "وشى — مختبر التصميم",
};

function resolveRoute(pathname: string): Route {
  if (pathname.startsWith(ROUTES.dev)) return "dev";
  if (pathname.startsWith(ROUTES.prod)) return "prod";
  return "chemistry";
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => resolveRoute(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(resolveRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);

  if (route === "dev") return <WashaDevStudio />;
  if (route === "prod") return <WashaProductionStudio />;
  return (
    <Suspense fallback={null}>
      <ChemistryApp />
    </Suspense>
  );
}
