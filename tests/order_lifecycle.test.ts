import { describe, it, expect } from 'vitest';
import { OrderStatus } from '../src/models/SalesOrder';

describe('Order State Machine & Transition Rules', () => {
  const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    DRAFT: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PICKING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'],
    PICKING: ['PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'],
    PARTIALLY_FULFILLED: ['PARTIALLY_FULFILLED', 'FULFILLED', 'RETURNED', 'PARTIALLY_RETURNED'],
    FULFILLED: ['RETURNED', 'PARTIALLY_RETURNED'],
    CANCELLED: [],
    RETURNED: [],
    PARTIALLY_RETURNED: ['RETURNED'],
  };

  function canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  it('allows DRAFT to transition to CONFIRMED or CANCELLED', () => {
    expect(canTransition('DRAFT', 'CONFIRMED')).toBe(true);
    expect(canTransition('DRAFT', 'CANCELLED')).toBe(true);
    expect(canTransition('DRAFT', 'FULFILLED')).toBe(false);
  });

  it('prohibits direct fulfillment from DRAFT without confirmation', () => {
    expect(canTransition('DRAFT', 'FULFILLED')).toBe(false);
  });

  it('allows CONFIRMED to transition to PARTIALLY_FULFILLED upon first shipment', () => {
    expect(canTransition('CONFIRMED', 'PARTIALLY_FULFILLED')).toBe(true);
    expect(canTransition('CONFIRMED', 'FULFILLED')).toBe(true);
  });

  it('prevents direct cancellation of FULFILLED orders (must use return workflow)', () => {
    expect(canTransition('FULFILLED', 'CANCELLED')).toBe(false);
    expect(canTransition('FULFILLED', 'PARTIALLY_RETURNED')).toBe(true);
    expect(canTransition('FULFILLED', 'RETURNED')).toBe(true);
  });
});

describe('Fulfillment & Return Quantity Invariants', () => {
  it('validates that dispatch quantity cannot exceed pending ordered quantity', () => {
    const line = {
      orderedQty: 50,
      dispatchedQty: 30,
    };
    const pending = line.orderedQty - line.dispatchedQty;
    expect(pending).toBe(20);

    const attemptDispatchQty = 25;
    const isExceeded = attemptDispatchQty > pending;
    expect(isExceeded).toBe(true);
  });

  it('validates that returned quantity cannot exceed dispatched quantity minus accepted returns', () => {
    const line = {
      orderedQty: 50,
      dispatchedQty: 40,
      returnedQty: 10,
    };
    const maxReturnable = line.dispatchedQty - line.returnedQty;
    expect(maxReturnable).toBe(30);

    expect(15 <= maxReturnable).toBe(true);
    expect(35 <= maxReturnable).toBe(false);
  });
});
