import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider
      router={createBrowserRouter(
        createRoutesFromElements(
          <Route path="/" lazy={() => import("./App.tsx")} />,
        ),
      )}
    />
  </StrictMode>,
);
