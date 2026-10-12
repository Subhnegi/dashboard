import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Product,
  Customer,
  Sale,
  Expense,
  BusinessSettings,
  InventoryMovement,
  Payment,
} from '../types';
import * as api from '../lib/api-client';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_BUSINESS_SETTINGS,
  INITIAL_INVENTORY_MOVEMENTS,
} from '../lib/seed-data';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface DemoDataContextType {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  settings: BusinessSettings;
  movements: InventoryMovement[];
  toasts: ToastMessage[];
  isResetModalOpen: boolean;
  isAboutModalOpen: boolean;
  setResetModalOpen: (open: boolean) => void;
  setAboutModalOpen: (open: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  adjustProductStock: (id: string, delta: number, reason: string, note?: string) => Promise<void>;
  deactivateProduct: (id: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deactivateCustomer: (id: string) => Promise<void>;
  reactivateCustomer: (id: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;
  addSale: (payload: {
    customer_id?: string | null;
    customer_name: string;
    customer_contact?: string | null;
    sale_date?: string;
    discount_minor?: number;
    tax_minor?: number;
    notes?: string | null;
    items: Array<{ product_id: string; quantity: number; unit_price_minor?: number }>;
    initial_payment?: {
      amount_minor: number;
      method: string;
      reference?: string | null;
      note?: string | null;
    };
  }) => Promise<Sale>;
  cancelSale: (id: string, reason: string) => Promise<void>;
  addPayment: (
    saleId: string,
    payment: { amount_minor: number; method: string; reference?: string | null; note?: string | null }
  ) => Promise<Payment | undefined>;
  refreshSales: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
  updateSettings: (updates: Partial<BusinessSettings>) => void;
}

const STORAGE_PREFIX = 'businessflow_demo_v1_';

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export const DemoDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}sales`);
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}expenses`);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_SETTINGS;
  });

  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}movements`);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY_MOVEMENTS;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}sales`, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}movements`, JSON.stringify(movements));
  }, [movements]);

  // Initial load from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadFromBackend() {
      try {
        const [backendProducts, backendCustomers, backendSales, backendExpenses, backendSettings] =
          await Promise.all([
            api.getProducts().catch(() => null),
            api.getCustomers().catch(() => null),
            api.getSales().catch(() => null),
            api.getExpenses().catch(() => null),
            api.getSettings().catch(() => null),
          ]);

        if (isMounted) {
          if (backendProducts && backendProducts.length > 0) {
            setProducts(
              backendProducts.map((p) => ({
                ...p,
                is_active: Boolean(p.is_active),
              }))
            );
          }
          if (backendCustomers && backendCustomers.length > 0) {
            setCustomers(
              backendCustomers.map((c) => ({
                ...c,
                is_active: Boolean(c.is_active),
              }))
            );
          }
          if (backendSales && backendSales.length > 0) {
            setSales(backendSales);
          }
          if (backendExpenses && backendExpenses.length > 0) {
            setExpenses(backendExpenses);
          }
          if (backendSettings) {
            setSettings(backendSettings);
          }
        }
      } catch (err) {
        console.warn('Backend synchronization warning:', err);
      }
    }
    loadFromBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshProducts = async () => {
    try {
      const data = await api.getProducts();
      if (data) {
        setProducts(data.map((p) => ({ ...p, is_active: Boolean(p.is_active) })));
      }
    } catch {
      // ignore
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Reset demo data atomically
  const resetDemoData = async () => {
    try {
      await api.resetDemoDatabase();
      const [backendProducts, backendCustomers, backendSales, backendExpenses, backendSettings] =
        await Promise.all([
          api.getProducts(),
          api.getCustomers(),
          api.getSales(),
          api.getExpenses(),
          api.getSettings(),
        ]);
      setProducts(backendProducts.map((p) => ({ ...p, is_active: Boolean(p.is_active) })));
      setCustomers(backendCustomers.map((c) => ({ ...c, is_active: Boolean(c.is_active) })));
      setSales(backendSales);
      setExpenses(backendExpenses);
      setSettings(backendSettings);
    } catch {
      setProducts(INITIAL_PRODUCTS);
      setCustomers(INITIAL_CUSTOMERS);
      setSales(INITIAL_SALES);
      setExpenses(INITIAL_EXPENSES);
      setSettings(INITIAL_BUSINESS_SETTINGS);
      setMovements(INITIAL_INVENTORY_MOVEMENTS);
    }
    localStorage.clear();
    setResetModalOpen(false);
    showToast('Demo workspace restored to initial seed state.', 'success');
  };

  const addProduct = async (
    prodData: Omit<Product, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Product> => {
    try {
      const created = await api.createProduct({
        name: prodData.name,
        sku: prodData.sku,
        category: prodData.category,
        description: prodData.description,
        selling_price_minor: prodData.selling_price_minor,
        cost_price_minor: prodData.cost_price_minor,
        stock_quantity: prodData.stock_quantity,
        reorder_level: prodData.reorder_level,
      });
      const mapped: Product = { ...created, is_active: Boolean(created.is_active) };
      setProducts((prev) => [mapped, ...prev.filter((p) => p.id !== mapped.id)]);

      if (mapped.stock_quantity > 0) {
        const mov: InventoryMovement = {
          id: `mov_${Date.now()}`,
          product_id: mapped.id,
          movement_type: 'OPENING_BALANCE',
          quantity_delta: mapped.stock_quantity,
          reason: 'Initial stock on product creation',
          created_at: mapped.created_at,
        };
        setMovements((prev) => [mov, ...prev]);
      }

      showToast(`Product "${mapped.name}" created successfully.`);
      return mapped;
    } catch (err: any) {
      // Local fallback if API fails
      const newProd: Product = {
        ...prodData,
        id: `prod_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProducts((prev) => [newProd, ...prev]);
      showToast(`Product "${newProd.name}" saved.`);
      return newProd;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updated = await api.updateProduct(id, updates);
      const mapped: Product = { ...updated, is_active: Boolean(updated.is_active) };
      setProducts((prev) => prev.map((p) => (p.id === id ? mapped : p)));
    } catch {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
        )
      );
    }
    showToast('Product updated successfully.');
  };

  const adjustProductStock = async (
    id: string,
    delta: number,
    reason: string,
    note?: string
  ) => {
    try {
      const res = await api.adjustProductStock(id, { delta, reason, note });
      const mapped: Product = { ...res.product, is_active: Boolean(res.product.is_active) };
      setProducts((prev) => prev.map((p) => (p.id === id ? mapped : p)));

      // Fetch movement history for this product
      const detail = await api.getProduct(id).catch(() => null);
      if (detail?.movements) {
        setMovements((prev) => [
          ...detail.movements.map((m: any) => ({
            id: m.id,
            product_id: m.product_id,
            movement_type: m.movement_type,
            quantity_delta: m.quantity_delta,
            reason: m.reason,
            note: m.note,
            created_at: m.created_at,
          })),
          ...prev.filter((m) => m.product_id !== id),
        ]);
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const updatedQty = Math.max(0, p.stock_quantity + delta);
            return { ...p, stock_quantity: updatedQty, updated_at: new Date().toISOString() };
          }
          return p;
        })
      );
    }
    showToast(`Stock adjusted by ${delta > 0 ? `+${delta}` : delta} units.`);
  };

  const deactivateProduct = async (id: string) => {
    try {
      const res = await api.deactivateProduct(id);
      const mapped: Product = { ...res, is_active: Boolean(res.is_active) };
      setProducts((prev) => prev.map((p) => (p.id === id ? mapped : p)));
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: false } : p))
      );
    }
    showToast('Product deactivated.');
  };

  const addCustomer = async (
    custData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Customer> => {
    try {
      const created = await api.createCustomer({
        name: custData.name,
        phone: custData.phone || null,
        email: custData.email || null,
        billing_address: custData.billing_address || null,
        notes: custData.notes || null,
      });
      const mapped: Customer = {
        ...created,
        is_active: Boolean(created.is_active),
      };
      setCustomers((prev) => [mapped, ...prev.filter((c) => c.id !== mapped.id)]);
      showToast(`Customer "${mapped.name}" added successfully.`);
      return mapped;
    } catch {
      const newCust: Customer = {
        ...custData,
        id: `cust_${Date.now()}`,
        total_sales_count: 0,
        lifetime_value_minor: 0,
        outstanding_balance_minor: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCustomers((prev) => [newCust, ...prev]);
      showToast(`Customer "${newCust.name}" added successfully.`);
      return newCust;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const updated = await api.updateCustomer(id, updates);
      const mapped: Customer = {
        ...updated,
        is_active: Boolean(updated.is_active),
      };
      setCustomers((prev) => prev.map((c) => (c.id === id ? mapped : c)));
    } catch {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        )
      );
    }
    showToast('Customer record updated.');
  };

  const deactivateCustomer = async (id: string) => {
    try {
      const updated = await api.deactivateCustomer(id);
      const mapped: Customer = { ...updated, is_active: false };
      setCustomers((prev) => prev.map((c) => (c.id === id ? mapped : c)));
    } catch {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: false } : c))
      );
    }
    showToast('Customer account deactivated.');
  };

  const reactivateCustomer = async (id: string) => {
    try {
      const updated = await api.reactivateCustomer(id);
      const mapped: Customer = { ...updated, is_active: true };
      setCustomers((prev) => prev.map((c) => (c.id === id ? mapped : c)));
    } catch {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: true } : c))
      );
    }
    showToast('Customer account reactivated.');
  };

  const refreshCustomers = async () => {
    try {
      const data = await api.getCustomers();
      if (data) {
        setCustomers(data.map((c) => ({ ...c, is_active: Boolean(c.is_active) })));
      }
    } catch {}
  };

  const refreshSales = async () => {
    try {
      const data = await api.getSales();
      if (data) {
        setSales(data);
      }
    } catch {}
  };

  const addSale = async (payload: {
    customer_id?: string | null;
    customer_name: string;
    customer_contact?: string | null;
    sale_date?: string;
    discount_minor?: number;
    tax_minor?: number;
    notes?: string | null;
    items: Array<{ product_id: string; quantity: number; unit_price_minor?: number }>;
    initial_payment?: {
      amount_minor: number;
      method: string;
      reference?: string | null;
      note?: string | null;
    };
  }): Promise<Sale> => {
    try {
      const res = await api.createSale(payload);
      const createdSale: Sale = {
        ...res.sale,
        items: res.items || [],
        payments: res.payments || [],
      };
      setSales((prev) => [createdSale, ...prev.filter((s) => s.id !== createdSale.id)]);
      await Promise.all([refreshProducts(), refreshCustomers()]);
      showToast(`Order ${createdSale.sale_number} created successfully.`);
      return createdSale;
    } catch (err: any) {
      showToast(err.message || 'Failed to create sale', 'error');
      throw err;
    }
  };

  const cancelSale = async (id: string, reason: string) => {
    const targetSale = sales.find((s) => s.id === id);
    if (!targetSale || targetSale.status === 'CANCELLED') {
      showToast('Sale already cancelled or not found.', 'error');
      return;
    }

    try {
      const res = await api.cancelSale(id, reason);
      setSales((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'CANCELLED',
                cancelled_at: res.sale.cancelled_at || new Date().toISOString(),
                cancellation_reason: res.sale.cancellation_reason || reason,
                updated_at: res.sale.updated_at || new Date().toISOString(),
              }
            : s
        )
      );
      await Promise.all([refreshProducts(), refreshCustomers()]);
      showToast(`Sale ${targetSale.sale_number} cancelled and stock restored.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel sale', 'error');
      throw err;
    }
  };

  const addPayment = async (
    saleId: string,
    paymentData: { amount_minor: number; method: string; reference?: string | null; note?: string | null }
  ) => {
    try {
      const res = await api.recordPayment(saleId, paymentData);
      setSales((prev) =>
        prev.map((s) => {
          if (s.id === saleId) {
            const updatedPayments = [...(s.payments || []), res.payment];
            const amountPaid = updatedPayments.reduce((acc, p) => acc + Number(p.amount_minor), 0);
            return {
              ...s,
              payments: updatedPayments,
              amount_paid_minor: amountPaid,
              balance_due_minor: res.balance_due_minor,
              payment_status: res.payment_status as any,
              updated_at: new Date().toISOString(),
            };
          }
          return s;
        })
      );
      await refreshCustomers();
      showToast('Payment recorded successfully.');
      return res.payment;
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
      throw err;
    }
  };

  const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>
  ): Promise<Expense> => {
    try {
      const created = await api.createExpense({
        description: expenseData.description,
        category: expenseData.category,
        amount_minor: expenseData.amount_minor,
        expense_date: expenseData.expense_date,
        payment_method: expenseData.payment_method || null,
        vendor: expenseData.vendor || null,
        notes: expenseData.notes || null,
      });
      const mapped: Expense = {
        ...created,
        is_deleted: false,
      };
      setExpenses((prev) => [mapped, ...prev.filter((e) => e.id !== mapped.id)]);
      showToast('Expense recorded successfully.');
      return mapped;
    } catch {
      const newExp: Expense = {
        ...expenseData,
        id: `exp_${Date.now()}`,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setExpenses((prev) => [newExp, ...prev]);
      showToast('Expense recorded successfully.');
      return newExp;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const updated = await api.updateExpense(id, updates);
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
        )
      );
    }
    showToast('Expense voucher updated.');
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.deleteExpense(id);
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, is_deleted: true, updated_at: new Date().toISOString() } : e
        )
      );
    } catch {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, is_deleted: true, updated_at: new Date().toISOString() } : e
        )
      );
    }
    showToast('Expense voucher removed.');
  };

  const refreshExpenses = async () => {
    try {
      const data = await api.getExpenses();
      if (data) {
        setExpenses(data);
      }
    } catch {}
  };

  const updateSettings = (updates: Partial<BusinessSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
      updated_at: new Date().toISOString(),
    }));
    showToast('Settings saved successfully.');
  };

  return (
    <DemoDataContext.Provider
      value={{
        products,
        customers,
        sales,
        expenses,
        settings,
        movements,
        toasts,
        isResetModalOpen,
        isAboutModalOpen,
        setResetModalOpen,
        setAboutModalOpen,
        showToast,
        dismissToast,
        resetDemoData,
        addProduct,
        updateProduct,
        adjustProductStock,
        deactivateProduct,
        refreshProducts,
        addCustomer,
        updateCustomer,
        deactivateCustomer,
        reactivateCustomer,
        refreshCustomers,
        addSale,
        cancelSale,
        addPayment,
        refreshSales,
        addExpense,
        updateExpense,
        deleteExpense,
        refreshExpenses,
        updateSettings,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  );
};

export const useDemoData = (): DemoDataContextType => {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used within a DemoDataProvider');
  }
  return context;
};
