import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Rotas do app do cliente
import Entrada from "./pages/Entrada";
import Home from "./pages/Home";
import Cardapio from "./pages/Cardapio";
import Produto from "./pages/Produto";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import Pedido from "./pages/Pedido";
import Pedidos from "./pages/Pedidos";
import Ofertas from "./pages/Ofertas";
import Perfil from "./pages/Perfil";
import Garcom from "./pages/Garcom";
import Cozinha from "./pages/Cozinha";
import ProtectedAccess from "./components/ProtectedAccess";

// Painel administrativo
import AdminRouter from "./pages/admin/AdminRouter";

function GarcomProtegido() {
  return (
    <ProtectedAccess role="garcom">
      <Garcom />
    </ProtectedAccess>
  );
}

function CozinhaProtegida() {
  return (
    <ProtectedAccess role="cozinha">
      <Cozinha />
    </ProtectedAccess>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Entrada} />
      <Route path={"/inicio"} component={Home} />
      <Route path={"/cardapio"} component={Cardapio} />
      <Route path={"/produto/:id"} component={Produto} />
      <Route path={"/carrinho"} component={Carrinho} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/pedido/:code"} component={Pedido} />
      <Route path={"/pedidos"} component={Pedidos} />
      <Route path={"/ofertas"} component={Ofertas} />
      <Route path={"/perfil"} component={Perfil} />
      <Route path={"/garcom"} component={GarcomProtegido} />
      <Route path={"/cozinha"} component={CozinhaProtegida} />
      <Route path={"/admin"} component={AdminRouter} />
      <Route path={"/admin/:path*"} component={AdminRouter} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <CartProvider>
            <Toaster />
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
