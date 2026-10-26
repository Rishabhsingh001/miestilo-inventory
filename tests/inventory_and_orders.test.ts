import { describe, it, expect } from 'vitest';
import { calculateAvailable } from '../src/models/StockBalance';
import { hasPermission, ROLE_PERMISSIONS } from '../src/lib/permissions/roles';
import { escapeCsvCell } from '../src/services/reporting.service';

describe('Inventory Calculation Invariants', () => {
  it('correctly calculates available stock = onHand - reserved - damaged - quarantined', () => {
    const balance = {
      onHand: 100,
      reserved: 20,
      damaged: 5,
      quarantined: 10,
    };
    const available = calculateAvailable(balance);
    expect(available).toBe(65);
  });

  it('prevents negative available stock when reservations exceed on-hand', () => {
    const balance = {
      onHand: 15,
      reserved: 20,
      damaged: 0,
      quarantined: 0,
    };
    const available = calculateAvailable(balance);
    expect(available).toBe(0);
  });

  it('correctly accounts for zero damaged and quarantined stock', () => {
    const balance = {
      onHand: 50,
      reserved: 10,
      damaged: 0,
      quarantined: 0,
    };
    expect(calculateAvailable(balance)).toBe(40);
  });
});

describe('Role-Based Access Control (RBAC)', () => {
  it('allows SUPER_ADMIN full operational permissions', () => {
    expect(hasPermission('SUPER_ADMIN', 'inventory:receive')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'orders:confirm')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'cost_price:view')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'users:manage')).toBe(true);
  });

  it('restricts WAREHOUSE_STAFF from seeing cost prices and creating orders', () => {
    expect(hasPermission('WAREHOUSE_STAFF', 'cost_price:view')).toBe(false);
    expect(hasPermission('WAREHOUSE_STAFF', 'orders:create')).toBe(false);
    expect(hasPermission('WAREHOUSE_STAFF', 'orders:dispatch')).toBe(true);
  });

  it('allows SALES_MANAGER to create and confirm orders but not adjust stock', () => {
    expect(hasPermission('SALES_MANAGER', 'orders:create')).toBe(true);
    expect(hasPermission('SALES_MANAGER', 'orders:confirm')).toBe(true);
    expect(hasPermission('SALES_MANAGER', 'inventory:adjust')).toBe(false);
  });

  it('allows INVENTORY_MANAGER to receive and adjust stock but not confirm sales orders', () => {
    expect(hasPermission('INVENTORY_MANAGER', 'inventory:receive')).toBe(true);
    expect(hasPermission('INVENTORY_MANAGER', 'inventory:adjust')).toBe(true);
    expect(hasPermission('INVENTORY_MANAGER', 'orders:confirm')).toBe(false);
  });
});

describe('Security: CSV Formula Injection Prevention', () => {
  it('escapes leading equals sign =cmd|...', () => {
    const malicious = '=1+2';
    const escaped = escapeCsvCell(malicious);
    expect(escaped).toBe("\"'=1+2\"");
  });

  it('escapes leading plus sign +cmd|...', () => {
    const malicious = '+cmd| /C calc';
    const escaped = escapeCsvCell(malicious);
    expect(escaped).toBe("\"'+cmd| /C calc\"");
  });

  it('escapes leading minus sign -5+5', () => {
    const malicious = '-100';
    const escaped = escapeCsvCell(malicious);
    expect(escaped).toBe("\"'-100\"");
  });

  it('escapes leading at sign @SUM(...)', () => {
    const malicious = '@SUM(A1:A10)';
    const escaped = escapeCsvCell(malicious);
    expect(escaped).toBe("\"'@SUM(A1:A10)\"");
  });

  it('properly quotes standard strings', () => {
    const normal = 'Hotel Luxury Bedsheet';
    expect(escapeCsvCell(normal)).toBe('"Hotel Luxury Bedsheet"');
  });
});
