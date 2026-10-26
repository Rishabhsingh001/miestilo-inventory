export type Role = 
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'INVENTORY_MANAGER'
  | 'SALES_MANAGER'
  | 'WAREHOUSE_STAFF'
  | 'MANAGEMENT';

export type Permission =
  | 'inventory:read'
  | 'inventory:receive'
  | 'inventory:transfer'
  | 'inventory:adjust'
  | 'inventory:reconcile'
  | 'products:read'
  | 'products:manage'
  | 'cost_price:view'
  | 'orders:read'
  | 'orders:create'
  | 'orders:confirm'
  | 'orders:cancel'
  | 'orders:dispatch'
  | 'returns:process'
  | 'customers:read'
  | 'customers:manage'
  | 'suppliers:manage'
  | 'reports:view'
  | 'reports:export'
  | 'users:manage'
  | 'audit:read';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'inventory:read', 'inventory:receive', 'inventory:transfer', 'inventory:adjust', 'inventory:reconcile',
    'products:read', 'products:manage', 'cost_price:view',
    'orders:read', 'orders:create', 'orders:confirm', 'orders:cancel', 'orders:dispatch',
    'returns:process',
    'customers:read', 'customers:manage', 'suppliers:manage',
    'reports:view', 'reports:export',
    'users:manage', 'audit:read'
  ],
  ADMIN: [
    'inventory:read', 'inventory:receive', 'inventory:transfer', 'inventory:adjust', 'inventory:reconcile',
    'products:read', 'products:manage', 'cost_price:view',
    'orders:read', 'orders:create', 'orders:confirm', 'orders:cancel', 'orders:dispatch',
    'returns:process',
    'customers:read', 'customers:manage', 'suppliers:manage',
    'reports:view', 'reports:export',
    'users:manage', 'audit:read'
  ],
  INVENTORY_MANAGER: [
    'inventory:read', 'inventory:receive', 'inventory:transfer', 'inventory:adjust', 'inventory:reconcile',
    'products:read', 'products:manage',
    'orders:read',
    'returns:process',
    'customers:read', 'suppliers:manage',
    'reports:view', 'reports:export',
    'audit:read'
  ],
  SALES_MANAGER: [
    'inventory:read',
    'products:read',
    'orders:read', 'orders:create', 'orders:confirm', 'orders:cancel',
    'customers:read', 'customers:manage',
    'reports:view', 'reports:export'
  ],
  WAREHOUSE_STAFF: [
    'inventory:read',
    'products:read',
    'orders:read', 'orders:dispatch',
    'returns:process'
  ],
  MANAGEMENT: [
    'inventory:read',
    'products:read', 'cost_price:view',
    'orders:read',
    'customers:read',
    'reports:view', 'reports:export',
    'audit:read'
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
