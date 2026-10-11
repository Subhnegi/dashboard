import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardView } from '../features/dashboard/DashboardView';
import { ProductsListView } from '../features/products/ProductsListView';
import { ProductCreateView } from '../features/products/ProductCreateView';
import { ProductDetailView } from '../features/products/ProductDetailView';
import { CustomersListView } from '../features/customers/CustomersListView';
import { CustomerDetailView } from '../features/customers/CustomerDetailView';
import { SalesListView } from '../features/sales/SalesListView';
import { SaleCreateView } from '../features/sales/SaleCreateView';
import { SaleDetailView } from '../features/sales/SaleDetailView';
import { InvoicesListView } from '../features/invoices/InvoicesListView';
import { InvoiceDetailView } from '../features/invoices/InvoiceDetailView';
import { ExpensesListView } from '../features/expenses/ExpensesListView';
import { ReportsView } from '../features/reports/ReportsView';
import { SettingsView } from '../features/settings/SettingsView';
import { NotFoundView } from '../features/feedback/NotFoundView';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardView />,
      },
      {
        path: 'products',
        element: <ProductsListView />,
      },
      {
        path: 'products/new',
        element: <ProductCreateView />,
      },
      {
        path: 'products/:id',
        element: <ProductDetailView />,
      },
      {
        path: 'customers',
        element: <CustomersListView />,
      },
      {
        path: 'customers/:id',
        element: <CustomerDetailView />,
      },
      {
        path: 'sales',
        element: <SalesListView />,
      },
      {
        path: 'sales/new',
        element: <SaleCreateView />,
      },
      {
        path: 'sales/:id',
        element: <SaleDetailView />,
      },
      {
        path: 'invoices',
        element: <InvoicesListView />,
      },
      {
        path: 'invoices/:id',
        element: <InvoiceDetailView />,
      },
      {
        path: 'expenses',
        element: <ExpensesListView />,
      },
      {
        path: 'reports',
        element: <ReportsView />,
      },
      {
        path: 'settings',
        element: <SettingsView />,
      },
      {
        path: '*',
        element: <NotFoundView />,
      },
    ],
  },
]);
