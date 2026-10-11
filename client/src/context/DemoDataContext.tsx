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
  resetDemoData: () => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  adjustProductStock: (id: string, delta: number, reason: string, note?: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  addSale: (newSale: Omit<Sale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>) => Sale;
  cancelSale: (id: string, reason: string) => void;
  addPayment: (saleId: string, payment: Omit<Payment, 'id' | 'sale_id' | 'created_at'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>) => Expense;
  deleteExpense: (id: string) => void;
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
  const resetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setSettings(INITIAL_BUSINESS_SETTINGS);
    setMovements(INITIAL_INVENTORY_MOVEMENTS);
    localStorage.clear();
    setResetModalOpen(false);
    showToast('Demo workspace restored to initial seed state.', 'success');
  };

  const addProduct = (prodData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product => {
    const newProd: Product = {
      ...prodData,
      id: `prod_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);

    // Record opening balance movement if initial stock > 0
    if (newProd.stock_quantity > 0) {
      const movement: InventoryMovement = {
        id: `mov_${Date.now()}`,
        product_id: newProd.id,
        movement_type: 'OPENING_BALANCE',
        quantity_delta: newProd.stock_quantity,
        reason: 'Initial stock on product creation',
        created_at: new Date().toISOString(),
      };
      setMovements((prev) => [movement, ...prev]);
    }

    showToast(`Product "${newProd.name}" created successfully.`);
    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      )
    );
    showToast('Product updated successfully.');
  };

  const adjustProductStock = (id: string, delta: number, reason: string, note?: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedQty = Math.max(0, p.stock_quantity + delta);
          return { ...p, stock_quantity: updatedQty, updated_at: new Date().toISOString() };
        }
        return p;
      })
    );

    const movement: InventoryMovement = {
      id: `mov_${Date.now()}`,
      product_id: id,
      movement_type: delta >= 0 ? 'STOCK_RECEIVED' : 'DAMAGED_LOST',
      quantity_delta: delta,
      reason,
      note,
      created_at: new Date().toISOString(),
    };
    setMovements((prev) => [movement, ...prev]);
    showToast(`Stock adjusted by ${delta > 0 ? `+${delta}` : delta} units.`);
  };

  const addCustomer = (custData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `cust_${Date.now()}`,
      total_sales_count: 0,
      lifetime_value_minor: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    showToast(`Customer "${newCust.name}" added successfully.`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      )
    );
    showToast('Customer record updated.');
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>): Sale => {
    const saleNum = `${settings.invoice_prefix}${(sales.length + 101).toString().padStart(5, '0')}`;
    const newSale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}`,
      sale_number: saleNum,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Atomically decrement stock and record movements
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const lineItem = newSale.items.find((item) => item.product_id === p.id);
        if (lineItem) {
          return {
            ...p,
            stock_quantity: Math.max(0, p.stock_quantity - lineItem.quantity),
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    const newMovements: InventoryMovement[] = newSale.items.map((item) => ({
      id: `mov_${Date.now()}_${item.id}`,
      product_id: item.product_id,
      movement_type: 'SALE',
      quantity_delta: -item.quantity,
      reason: `Fulfilled Sale ${saleNum}`,
      reference_type: 'sale',
      reference_id: newSale.id,
      created_at: new Date().toISOString(),
    }));

    setMovements((prev) => [...newMovements, ...prev]);
    setSales((prev) => [newSale, ...prev]);

    // Update customer stats
    if (newSale.customer_id) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === newSale.customer_id) {
            return {
              ...c,
              total_sales_count: (c.total_sales_count || 0) + 1,
              lifetime_value_minor: (c.lifetime_value_minor || 0) + newSale.total_minor,
            };
          }
          return c;
        })
      );
    }

    showToast(`Order ${saleNum} created successfully.`);
    return newSale;
  };

  const cancelSale = (id: string, reason: string) => {
    const targetSale = sales.find((s) => s.id === id);
    if (!targetSale || targetSale.status === 'CANCELLED') {
      showToast('Sale already cancelled or not found.', 'error');
      return;
    }

    // Revert inventory
    setProducts((prev) =>
      prev.map((p) => {
        const line = targetSale.items.find((item) => item.product_id === p.id);
        if (line) {
          return {
            ...p,
            stock_quantity: p.stock_quantity + line.quantity,
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    const revertMovements: InventoryMovement[] = targetSale.items.map((item) => ({
      id: `mov_rev_${Date.now()}_${item.id}`,
      product_id: item.product_id,
      movement_type: 'SALE_REVERSAL',
      quantity_delta: item.quantity,
      reason: `Cancelled Sale ${targetSale.sale_number}: ${reason}`,
      reference_type: 'sale_reversal',
      reference_id: targetSale.id,
      created_at: new Date().toISOString(),
    }));

    setMovements((prev) => [...revertMovements, ...prev]);

    setSales((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'CANCELLED',
              cancelled_at: new Date().toISOString(),
              cancellation_reason: reason,
              updated_at: new Date().toISOString(),
            }
          : s
      )
    );

    showToast(`Sale ${targetSale.sale_number} cancelled and stock restored.`);
  };

  const addPayment = (saleId: string, paymentData: Omit<Payment, 'id' | 'sale_id' | 'created_at'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay_${Date.now()}`,
      sale_id: saleId,
      created_at: new Date().toISOString(),
    };

    setSales((prev) =>
      prev.map((s) => {
        if (s.id === saleId) {
          return {
            ...s,
            payments: [...s.payments, newPayment],
            updated_at: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    showToast('Payment recorded successfully.');
  };

  const addExpense = (
    expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>
  ): Expense => {
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
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, is_deleted: true, updated_at: new Date().toISOString() } : e
      )
    );
    showToast('Expense removed.');
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
        addCustomer,
        updateCustomer,
        addSale,
        cancelSale,
        addPayment,
        addExpense,
        deleteExpense,
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
