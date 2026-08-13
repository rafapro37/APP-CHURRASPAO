import { Switch, Route } from "wouter";
import ProtectedAccess from "@/components/ProtectedAccess";
import AdminDashboard from "./AdminDashboard";
import AdminPedidos from "./AdminPedidos";
import AdminProdutos from "./AdminProdutos";
import AdminCategorias from "./AdminCategorias";
import AdminPromocoes from "./AdminPromocoes";
import AdminCupons from "./AdminCupons";
import AdminClientes from "./AdminClientes";

export default function AdminRouter() {
  return (
    <ProtectedAccess role="admin">
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/pedidos" component={AdminPedidos} />
        <Route path="/admin/produtos" component={AdminProdutos} />
        <Route path="/admin/categorias" component={AdminCategorias} />
        <Route path="/admin/promocoes" component={AdminPromocoes} />
        <Route path="/admin/cupons" component={AdminCupons} />
        <Route path="/admin/clientes" component={AdminClientes} />
      </Switch>
    </ProtectedAccess>
  );
}
