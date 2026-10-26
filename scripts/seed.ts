import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/connection';
import { User } from '../src/models/User';
import { Category } from '../src/models/Category';
import { Warehouse } from '../src/models/Warehouse';
import { Product } from '../src/models/Product';
import { ProductVariant } from '../src/models/ProductVariant';
import { Customer } from '../src/models/Customer';
import { Supplier } from '../src/models/Supplier';
import { StockBalance } from '../src/models/StockBalance';
import { StockMovement } from '../src/models/StockMovement';
import { StockReceipt } from '../src/models/StockReceipt';
import { StockTransfer } from '../src/models/StockTransfer';
import { StockAdjustment } from '../src/models/StockAdjustment';
import { CustomerReturn } from '../src/models/CustomerReturn';
import { SalesOrder } from '../src/models/SalesOrder';
import { Shipment } from '../src/models/Shipment';
import { AuditEvent } from '../src/models/AuditEvent';
import { Counter, getNextSequence } from '../src/models/Counter';

export async function runSeed() {
  console.log('[Seed] Connecting to database...');
  await connectToDatabase();

  console.log('[Seed] Purging all existing test data across all collections...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Warehouse.deleteMany({}),
    Product.deleteMany({}),
    ProductVariant.deleteMany({}),
    Customer.deleteMany({}),
    Supplier.deleteMany({}),
    StockBalance.deleteMany({}),
    StockMovement.deleteMany({}),
    StockReceipt.deleteMany({}),
    StockTransfer.deleteMany({}),
    StockAdjustment.deleteMany({}),
    CustomerReturn.deleteMany({}),
    SalesOrder.deleteMany({}),
    Shipment.deleteMany({}),
    AuditEvent.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  console.log('[Seed] Creating staff & management accounts...');
  const passwordHash = await bcrypt.hash('Misterio@2026', 10);
  const users = await User.create([
    {
      name: 'Sajid Khan (Founder & MD)',
      email: 'owner@miestilo.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    {
      name: 'Aakash Verma (Operations Admin)',
      email: 'admin@miestilo.com',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    {
      name: 'Sunil Sharma (Inventory Lead)',
      email: 'inventory@miestilo.com',
      passwordHash,
      role: 'INVENTORY_MANAGER',
      isActive: true,
    },
    {
      name: 'Pooja Iyer (Sales Manager)',
      email: 'sales@miestilo.com',
      passwordHash,
      role: 'SALES_MANAGER',
      isActive: true,
    },
    {
      name: 'Ramesh Patel (Warehouse Operations)',
      email: 'warehouse@miestilo.com',
      passwordHash,
      role: 'WAREHOUSE_STAFF',
      isActive: true,
    },
  ]);

  console.log('[Seed] Creating 7 genuine product categories from MiEstilo catalog...');
  const categories = await Category.create([
    {
      name: 'Bed Linen Collection',
      slug: 'bed-linen',
      description: 'Pure cotton and commercial poly-cotton sheeting (400 TC, 300 TC, 210 TC, 150 GSM & 125 GSM)',
    },
    {
      name: 'Duvets, Covers & Comforters',
      slug: 'duvets-covers-comforters',
      description: 'All-season thermal lofts (400/300/200 GSM), tailored poly-cotton covers & ultrasonic comforters',
    },
    {
      name: 'Mattress Protection',
      slug: 'mattress-protection',
      description: 'Quilted cushioning (300 GSM) and waterproof breathable TPU barrier systems (220 GSM)',
    },
    {
      name: 'Pillows & Cushions',
      slug: 'pillows-cushions',
      description: 'Virgin Recron siliconized conjugated fiber inserts (750 gm King, 550 gm Standard, 350 gm Cushions)',
    },
    {
      name: 'Bath Mat Collection',
      slug: 'bath-mats',
      description: 'Heavy pure cotton 400 GSM & 300 GSM mats with Greek key jacquard border frames',
    },
    {
      name: 'Towel Collection',
      slug: 'towel-collection',
      description: 'Luxury combed pure cotton and performance poly-cotton bath & hand towels (600g, 550g, 500g, 150g)',
    },
    {
      name: 'Bed Runners & Accents',
      slug: 'bed-runners-accents',
      description: 'Solid smooth and designer quilted Holland velvet bed runners and matching cushion sets',
    },
  ]);

  const catMap = Object.fromEntries(categories.map((c: any) => [c.slug, c._id]));

  console.log('[Seed] Creating regional distribution hubs...');
  const warehouses = await Warehouse.create([
    {
      code: 'WH-BOM-01',
      name: 'Mumbai Central Distribution Hub',
      address: 'Plot 42, Marol Industrial Area, Andheri East',
      city: 'Mumbai',
      contactName: 'Ramesh Patel',
      contactPhone: '+91 99906 42820',
      isActive: true,
      locations: [
        { code: 'A1-01', zone: 'A', aisle: '1', shelf: '01' },
        { code: 'A1-02', zone: 'A', aisle: '1', shelf: '02' },
        { code: 'B2-01', zone: 'B', aisle: '2', shelf: '01' },
        { code: 'C3-01', zone: 'C', aisle: '3', shelf: '01' },
      ],
    },
    {
      code: 'WH-DEL-01',
      name: 'Delhi Northern Regional Depot',
      address: 'Phase III, Okhla Industrial Area',
      city: 'New Delhi',
      contactName: 'Vikram Mehta',
      contactPhone: '+91 98110 54321',
      isActive: true,
      locations: [
        { code: 'D1-01', zone: 'D', aisle: '1', shelf: '01' },
        { code: 'D1-02', zone: 'D', aisle: '1', shelf: '02' },
        { code: 'E2-01', zone: 'E', aisle: '2', shelf: '01' },
      ],
    },
    {
      code: 'WH-BLR-01',
      name: 'Bengaluru Southern Logistics Hub',
      address: 'Plot 18, Phase 1, Electronic City',
      city: 'Bengaluru',
      contactName: 'Karthik Nair',
      contactPhone: '+91 98450 78901',
      isActive: true,
      locations: [
        { code: 'S1-01', zone: 'S', aisle: '1', shelf: '01' },
        { code: 'S1-02', zone: 'S', aisle: '1', shelf: '02' },
      ],
    },
  ]);

  console.log('[Seed] Creating luxury hotel customers...');
  const customers = await Customer.create([
    {
      customerCode: 'CUST-0001',
      companyName: 'Taj Lands End, Mumbai',
      contactName: 'Rohit Kulkarni (Procurement Director)',
      email: 'procurement@tajlandsend.local',
      phone: '+91 22 6668 1234',
      billingAddress: 'BJ Road, Bandstand, Bandra West, Mumbai 400050',
      shippingAddresses: [
        {
          label: 'Taj Lands End Main Store',
          street: 'BJ Road, Bandstand, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400050',
          isDefault: true,
        },
      ],
      taxId: '27AABCT3518Q1ZV',
      notes: 'Weekly delivery schedule. Standard specification: 400 TC Bedsheets & 600 GM pure cotton towels.',
      isActive: true,
    },
    {
      customerCode: 'CUST-0002',
      companyName: 'The Oberoi, New Delhi',
      contactName: 'Kavita Menon (Head of Housekeeping)',
      email: 'housekeeping@oberoidelhi.local',
      phone: '+91 11 2436 3030',
      billingAddress: 'Dr. Zakir Hussain Marg, New Delhi 110003',
      shippingAddresses: [
        {
          label: 'The Oberoi Linen Receiving Dock',
          street: 'Dr. Zakir Hussain Marg',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110003',
          isDefault: true,
        },
      ],
      taxId: '07AABCE2209L1Z5',
      notes: 'Zero defect tolerance. Deliveries accepted Monday and Thursday mornings.',
      isActive: true,
    },
    {
      customerCode: 'CUST-0003',
      companyName: 'JW Marriott Hotel Mumbai Juhu',
      contactName: 'Arjun Singhania (Supply Chain)',
      email: 'supply@jwmarriottjuhu.local',
      phone: '+91 22 6693 3000',
      billingAddress: 'Juhu Tara Road, Juhu, Mumbai 400049',
      shippingAddresses: [
        {
          label: 'JW Marriott Receiving Gate 2',
          street: 'Juhu Tara Road, Juhu',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400049',
          isDefault: true,
        },
      ],
      taxId: '27AABCI4819M1ZY',
      notes: 'High volume partner for duvets and Recron king pillows.',
      isActive: true,
    },
    {
      customerCode: 'CUST-0004',
      companyName: 'The Leela Palace Bengaluru',
      contactName: 'Anand Swaminathan (Materials Manager)',
      email: 'materials@theleelabangalore.local',
      phone: '+91 80 2521 1234',
      billingAddress: '23 Old Airport Road, Kodihalli, Bengaluru 560008',
      shippingAddresses: [
        {
          label: 'The Leela Palace Inward Dock',
          street: '23 Old Airport Road, Kodihalli',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560008',
          isDefault: true,
        },
      ],
      taxId: '29AABCL5512N1Z8',
      notes: 'Quilted bed runner sets in Emerald Green and Sapphire Blue.',
      isActive: true,
    },
    {
      customerCode: 'CUST-0005',
      companyName: 'ITC Maurya, New Delhi',
      contactName: 'Devika Roy (Executive Housekeeper)',
      email: 'housekeeping@itcmaurya.local',
      phone: '+91 11 2611 2233',
      billingAddress: 'Diplomatic Enclave, Sardar Patel Marg, New Delhi 110021',
      shippingAddresses: [
        {
          label: 'ITC Maurya Linen Receiving Area',
          street: 'Diplomatic Enclave, Sardar Patel Marg',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110021',
          isDefault: true,
        },
      ],
      taxId: '07AABCI1102P1Z3',
      notes: 'Heavy pure cotton bath mats and 300 TC bedsheets.',
      isActive: true,
    },
  ]);

  console.log('[Seed] Creating certified raw material & fabric suppliers...');
  await Supplier.create([
    {
      supplierCode: 'SUP-0001',
      name: 'Trident Group India Ltd',
      contactName: 'Sanjay Aggarwal',
      email: 'procurement@tridentindia.local',
      phone: '+91 161 5039 999',
      address: 'Trident Complex, Raikot Road, Barnala, Punjab 148101',
      taxId: '03AAACT7721A1ZG',
      isActive: true,
    },
    {
      supplierCode: 'SUP-0002',
      name: 'Vardhman Textiles Ltd',
      contactName: 'Neeraj Singhal',
      email: 'yarn@vardhman.local',
      phone: '+91 161 2228 943',
      address: 'Chandigarh Road, Ludhiana, Punjab 141010',
      taxId: '03AAACV0344K1ZS',
      isActive: true,
    },
    {
      supplierCode: 'SUP-0003',
      name: 'Reliance Polyester Fiber (Recron Division)',
      contactName: 'Praveen Shah',
      email: 'recron.sales@ril.local',
      phone: '+91 22 3555 5000',
      address: 'Maker Chambers IV, Nariman Point, Mumbai 400021',
      taxId: '27AAACR5055K1Z1',
      isActive: true,
    },
  ]);

  console.log('[Seed] Creating all 30 MiEstilo Catalog Products and their SKU Variants...');

  // 30 Catalog Products definition
  const catalogDefinitions = [
    // --- SECTION 01: BED LINEN COLLECTION ---
    {
      name: 'Pure Cotton Bedsheet 400 TC',
      slug: 'pure-cotton-bedsheet-400-tc',
      catSlug: 'bed-linen',
      description: '100% Pure Long-Staple Cotton, 400 Thread Count, Luxury Satin Stripe weave. Ultra-durable five-star luxury with silky luster.',
      unit: 'PIECE',
      reorderLevel: 25,
      defaultSellingPriceMinor: 249900,
      defaultCostMinor: 135000,
      variants: [
        { sku: 'ME-BL-400-KNG', name: 'King (108 x 108 inches)', size: '108 x 108"', color: 'Optical White', tc: 400, weave: 'Luxury Satin Stripe', fabric: '100% Long-Staple Cotton', price: 249900, cost: 135000, reorder: 30 },
        { sku: 'ME-BL-400-QEN', name: 'Queen (90 x 100 inches)', size: '90 x 100"', color: 'Optical White', tc: 400, weave: 'Luxury Satin Stripe', fabric: '100% Long-Staple Cotton', price: 219900, cost: 118000, reorder: 25 },
        { sku: 'ME-BL-400-SGL', name: 'Single (60 x 90 inches)', size: '60 x 90"', color: 'Optical White', tc: 400, weave: 'Luxury Satin Stripe', fabric: '100% Long-Staple Cotton', price: 149900, cost: 82000, reorder: 20 },
        { sku: 'ME-BL-400-PCV', name: 'Single Pillow Cover (18 x 28 inches)', size: '18 x 28"', color: 'Optical White', tc: 400, weave: 'Luxury Satin Stripe', fabric: '100% Long-Staple Cotton', price: 39900, cost: 19000, reorder: 50 },
      ],
    },
    {
      name: 'Pure Cotton Bedsheet 300 TC',
      slug: 'pure-cotton-bedsheet-300-tc',
      catSlug: 'bed-linen',
      description: '100% Pure Cotton, 300 Thread Count, White Satin Stripe. Silky luster and ultra-durable commercial hospitality construction.',
      unit: 'PIECE',
      reorderLevel: 25,
      defaultSellingPriceMinor: 199900,
      defaultCostMinor: 108000,
      variants: [
        { sku: 'ME-BL-300-KNG', name: 'King (108 x 108 inches)', size: '108 x 108"', color: 'Optical White', tc: 300, weave: 'White Satin Stripe', fabric: '100% Pure Cotton', price: 199900, cost: 108000, reorder: 25 },
        { sku: 'ME-BL-300-QEN', name: 'Queen (90 x 100 inches)', size: '90 x 100"', color: 'Optical White', tc: 300, weave: 'White Satin Stripe', fabric: '100% Pure Cotton', price: 179900, cost: 95000, reorder: 25 },
        { sku: 'ME-BL-300-SGL', name: 'Single (60 x 90 inches)', size: '60 x 90"', color: 'Optical White', tc: 300, weave: 'White Satin Stripe', fabric: '100% Pure Cotton', price: 119900, cost: 65000, reorder: 20 },
        { sku: 'ME-BL-300-PCV', name: 'Single Pillow Cover (18 x 28 inches)', size: '18 x 28"', color: 'Optical White', tc: 300, weave: 'White Satin Stripe', fabric: '100% Pure Cotton', price: 34900, cost: 16000, reorder: 40 },
      ],
    },
    {
      name: 'Pure Cotton Bedsheet 210 TC',
      slug: 'pure-cotton-bedsheet-210-tc',
      catSlug: 'bed-linen',
      description: '100% Pure Cotton, 210 Thread Count, White Lining. Natural airflow, smooth cool comfort, and long-lasting commercial durability.',
      unit: 'PIECE',
      reorderLevel: 25,
      defaultSellingPriceMinor: 159900,
      defaultCostMinor: 85000,
      variants: [
        { sku: 'ME-BL-210-KNG', name: 'King (108 x 108 inches)', size: '108 x 108"', color: 'Optical White', tc: 210, weave: 'White Lining', fabric: '100% Pure Cotton', price: 159900, cost: 85000, reorder: 25 },
        { sku: 'ME-BL-210-QEN', name: 'Queen (90 x 100 inches)', size: '90 x 100"', color: 'Optical White', tc: 210, weave: 'White Lining', fabric: '100% Pure Cotton', price: 139900, cost: 74000, reorder: 25 },
        { sku: 'ME-BL-210-SGL', name: 'Single (60 x 90 inches)', size: '60 x 90"', color: 'Optical White', tc: 210, weave: 'White Lining', fabric: '100% Pure Cotton', price: 99900, cost: 52000, reorder: 20 },
        { sku: 'ME-BL-210-PCV', name: 'Single Pillow Cover (18 x 28 inches)', size: '18 x 28"', color: 'Optical White', tc: 210, weave: 'White Lining', fabric: '100% Pure Cotton', price: 29900, cost: 13000, reorder: 40 },
      ],
    },
    {
      name: 'Poly-Cotton Bedsheet 150 GSM',
      slug: 'poly-cotton-bedsheet-150-gsm',
      catSlug: 'bed-linen',
      description: 'Premium Poly-Cotton Blend, 150 GSM Heavy Duty, White Lining / Commercial Stripe. High tensile strength, anti-wrinkle, fast turnaround.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 149900,
      defaultCostMinor: 78000,
      variants: [
        { sku: 'ME-BL-PC150-KNG', name: 'King (108 x 108 inches)', size: '108 x 108"', color: 'White Stripe', gsm: 150, weave: 'Commercial Stripe', fabric: 'Poly-Cotton Blend', price: 149900, cost: 78000, reorder: 30 },
        { sku: 'ME-BL-PC150-QEN', name: 'Queen (90 x 100 inches)', size: '90 x 100"', color: 'White Stripe', gsm: 150, weave: 'Commercial Stripe', fabric: 'Poly-Cotton Blend', price: 129900, cost: 68000, reorder: 25 },
        { sku: 'ME-BL-PC150-SGL', name: 'Single (60 x 90 inches)', size: '60 x 90"', color: 'White Stripe', gsm: 150, weave: 'Commercial Stripe', fabric: 'Poly-Cotton Blend', price: 89900, cost: 45000, reorder: 20 },
        { sku: 'ME-BL-PC150-PCV', name: 'Single Pillow Cover (18 x 28 inches)', size: '18 x 28"', color: 'White Stripe', gsm: 150, weave: 'Commercial Stripe', fabric: 'Poly-Cotton Blend', price: 24900, cost: 11000, reorder: 50 },
      ],
    },
    {
      name: 'Poly-Cotton Bedsheet 125 GSM (Classic White Lining)',
      slug: 'poly-cotton-bedsheet-125-gsm-lining',
      catSlug: 'bed-linen',
      description: 'Poly-Cotton Blend, 125 GSM, Classic White Lining. Easy care, quick drying, extended commercial service life.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 129900,
      defaultCostMinor: 68000,
      variants: [
        { sku: 'ME-BL-PC125L-KNG', name: 'King (108 x 108 inches)', size: '108 x 108"', color: 'White Lining', gsm: 125, weave: 'Classic Lining', fabric: 'Poly-Cotton Blend', price: 129900, cost: 68000, reorder: 30 },
        { sku: 'ME-BL-PC125L-QEN', name: 'Queen (90 x 100 inches)', size: '90 x 100"', color: 'White Lining', gsm: 125, weave: 'Classic Lining', fabric: 'Poly-Cotton Blend', price: 109900, cost: 58000, reorder: 25 },
        { sku: 'ME-BL-PC125L-SGL', name: 'Single (60 x 90 inches)', size: '60 x 90"', color: 'White Lining', gsm: 125, weave: 'Classic Lining', fabric: 'Poly-Cotton Blend', price: 79900, cost: 39000, reorder: 20 },
        { sku: 'ME-BL-PC125L-PCV', name: 'Single Pillow Cover (18 x 28 inches)', size: '18 x 28"', color: 'White Lining', gsm: 125, weave: 'Classic Lining', fabric: 'Poly-Cotton Blend', price: 21900, cost: 9500, reorder: 50 },
      ],
    },
    {
      name: 'Poly-Cotton Bedsheet 125 GSM (Solid Plain White)',
      slug: 'poly-cotton-bedsheet-125-gsm-solid-white',
      catSlug: 'bed-linen',
      description: 'Poly-Cotton Blend, 125 GSM, Solid Plain White. Smooth texture, pilling resistant, maximum commercial utility.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 124900,
      defaultCostMinor: 65000,
      variants: [
        { sku: 'ME-BL-PC125S-KNG', name: 'King (108 x 108 inches)', size: '108 x 108"', color: 'Solid White', gsm: 125, weave: 'Solid Plain', fabric: 'Poly-Cotton Blend', price: 124900, cost: 65000, reorder: 30 },
        { sku: 'ME-BL-PC125S-QEN', name: 'Queen (90 x 100 inches)', size: '90 x 100"', color: 'Solid White', gsm: 125, weave: 'Solid Plain', fabric: 'Poly-Cotton Blend', price: 104900, cost: 55000, reorder: 25 },
        { sku: 'ME-BL-PC125S-SGL', name: 'Single (60 x 90 inches)', size: '60 x 90"', color: 'Solid White', gsm: 125, weave: 'Solid Plain', fabric: 'Poly-Cotton Blend', price: 74900, cost: 37000, reorder: 20 },
        { sku: 'ME-BL-PC125S-PCV', name: 'Single Pillow Cover (18 x 28 inches)', size: '18 x 28"', color: 'Solid White', gsm: 125, weave: 'Solid Plain', fabric: 'Poly-Cotton Blend', price: 19900, cost: 8500, reorder: 50 },
      ],
    },
    {
      name: 'Color Lining Bedsheet 125 GSM (Deep Maroon)',
      slug: 'color-lining-bedsheet-125-gsm-maroon',
      catSlug: 'bed-linen',
      description: 'Poly-Cotton Blend, 125 GSM, Deep Maroon Color Stripe. Colorfast dyes, industrial wash durable with rich boutique aesthetic.',
      unit: 'PIECE',
      reorderLevel: 25,
      defaultSellingPriceMinor: 139900,
      defaultCostMinor: 72000,
      variants: [
        { sku: 'ME-BL-MRN125-KNG', name: 'King (108 x 108 inches)', size: '108 x 108"', color: 'Deep Maroon Stripe', gsm: 125, weave: 'Color Stripe', fabric: 'Poly-Cotton Blend', price: 139900, cost: 72000, reorder: 25 },
        { sku: 'ME-BL-MRN125-QEN', name: 'Queen (90 x 100 inches)', size: '90 x 100"', color: 'Deep Maroon Stripe', gsm: 125, weave: 'Color Stripe', fabric: 'Poly-Cotton Blend', price: 119900, cost: 62000, reorder: 25 },
        { sku: 'ME-BL-MRN125-SGL', name: 'Single (60 x 90 inches)', size: '60 x 90"', color: 'Deep Maroon Stripe', gsm: 125, weave: 'Color Stripe', fabric: 'Poly-Cotton Blend', price: 84900, cost: 42000, reorder: 20 },
        { sku: 'ME-BL-MRN125-PCV', name: 'Single Pillow Cover (18 x 28 inches)', size: '18 x 28"', color: 'Deep Maroon Stripe', gsm: 125, weave: 'Color Stripe', fabric: 'Poly-Cotton Blend', price: 23900, cost: 10000, reorder: 40 },
      ],
    },

    // --- SECTION 02: DUVETS, COVERS & COMFORTERS ---
    {
      name: 'Microfiber Duvet 400 GSM (Heavy Winter)',
      slug: 'microfiber-duvet-400-gsm-heavy-winter',
      catSlug: 'duvets-covers-comforters',
      description: 'Virgin Microfiber Shell & Fill, 400 GSM Heavy Winter Fill, Baffle Box Quilting. Maximum winter insulation with cloud-like loft.',
      unit: 'PIECE',
      reorderLevel: 15,
      defaultSellingPriceMinor: 289900,
      defaultCostMinor: 165000,
      variants: [
        { sku: 'ME-DV-400-QEN', name: 'Queen (90 x 100 inches, 3.3 kg)', size: '90 x 100"', color: 'Pure White', gsm: 400, weave: 'Baffle Box', fabric: 'Virgin Microfiber', price: 289900, cost: 165000, reorder: 20 },
        { sku: 'ME-DV-400-SGL', name: 'Single (60 x 90 inches, 2.4 kg)', size: '60 x 90"', color: 'Pure White', gsm: 400, weave: 'Baffle Box', fabric: 'Virgin Microfiber', price: 219900, cost: 125000, reorder: 15 },
      ],
    },
    {
      name: 'Microfiber Duvet 300 GSM (All-Season)',
      slug: 'microfiber-duvet-300-gsm-all-season',
      catSlug: 'duvets-covers-comforters',
      description: 'Virgin Microfiber Shell & Fill, 300 GSM All-Season Fill, Box Quilting. Balanced thermal loft, hypoallergenic and breathable.',
      unit: 'PIECE',
      reorderLevel: 20,
      defaultSellingPriceMinor: 249900,
      defaultCostMinor: 140000,
      variants: [
        { sku: 'ME-DV-300-KNG', name: 'King (90 x 100 inches, 3.0 kg)', size: '90 x 100"', color: 'Pure White', gsm: 300, weave: 'Box Quilted', fabric: 'Virgin Microfiber', price: 249900, cost: 140000, reorder: 25 },
        { sku: 'ME-DV-300-SGL', name: 'Single (60 x 90 inches, 2.0 kg)', size: '60 x 90"', color: 'Pure White', gsm: 300, weave: 'Box Quilted', fabric: 'Virgin Microfiber', price: 189900, cost: 105000, reorder: 20 },
      ],
    },
    {
      name: 'Microfiber Duvet 200 GSM (AC / Summer)',
      slug: 'microfiber-duvet-200-gsm-ac-summer',
      catSlug: 'duvets-covers-comforters',
      description: 'Microfiber Outer & Fill, 200 GSM AC / Summer Fill, Neat Baffle Quilting. Ultra-lightweight and temperature-balanced cloud softness.',
      unit: 'PIECE',
      reorderLevel: 20,
      defaultSellingPriceMinor: 199900,
      defaultCostMinor: 110000,
      variants: [
        { sku: 'ME-DV-200-QEN', name: 'Queen (90 x 100 inches, 2.35 kg)', size: '90 x 100"', color: 'Pure White', gsm: 200, weave: 'Baffle Quilting', fabric: 'Virgin Microfiber', price: 199900, cost: 110000, reorder: 20 },
        { sku: 'ME-DV-200-SGL', name: 'Single (60 x 90 inches, 1.5 kg)', size: '60 x 90"', color: 'Pure White', gsm: 200, weave: 'Baffle Quilting', fabric: 'Virgin Microfiber', price: 149900, cost: 85000, reorder: 15 },
      ],
    },
    {
      name: 'Poly-Cotton Duvet Cover 125 GSM',
      slug: 'poly-cotton-duvet-cover-125-gsm',
      catSlug: 'duvets-covers-comforters',
      description: 'Commercial Poly-Cotton Blend, 125 GSM, Solid White / Subtle Stripe. High tear strength, convenient insert closure, rapid laundering.',
      unit: 'PIECE',
      reorderLevel: 25,
      defaultSellingPriceMinor: 149900,
      defaultCostMinor: 80000,
      variants: [
        { sku: 'ME-DC-125-QEN', name: 'Queen (90 x 100 inches)', size: '90 x 100"', color: 'Solid White', gsm: 125, weave: 'Tailored Flange', fabric: 'Poly-Cotton Blend', price: 149900, cost: 80000, reorder: 25 },
        { sku: 'ME-DC-125-SGL', name: 'Single (60 x 90 inches)', size: '60 x 90"', color: 'Solid White', gsm: 125, weave: 'Tailored Flange', fabric: 'Poly-Cotton Blend', price: 109900, cost: 58000, reorder: 20 },
      ],
    },
    {
      name: 'Ultrasonic Comforter 100 GSM (Microfiber)',
      slug: 'ultrasonic-comforter-100-gsm-microfiber',
      catSlug: 'duvets-covers-comforters',
      description: 'Premium Microfiber Shell, 100 GSM (Total Weight: 1.0 kg), Ultrasonic Welded Embossing. Heat-sealed quilting, no thread breakage.',
      unit: 'PIECE',
      reorderLevel: 25,
      defaultSellingPriceMinor: 144900,
      defaultCostMinor: 75000,
      variants: [
        { sku: 'ME-UC-100-SD', name: 'Single / Double (78 x 90 inches)', size: '78 x 90"', color: 'Embossed White', gsm: 100, weave: 'Ultrasonic Welded', fabric: 'Microfiber Shell', price: 129900, cost: 68000, reorder: 20 },
        { sku: 'ME-UC-100-QN1', name: 'Queen (90 x 90 inches)', size: '90 x 90"', color: 'Embossed White', gsm: 100, weave: 'Ultrasonic Welded', fabric: 'Microfiber Shell', price: 144900, cost: 75000, reorder: 25 },
        { sku: 'ME-UC-100-QN2', name: 'Queen XL (90 x 100 inches)', size: '90 x 100"', color: 'Embossed White', gsm: 100, weave: 'Ultrasonic Welded', fabric: 'Microfiber Shell', price: 159900, cost: 82000, reorder: 25 },
      ],
    },
    {
      name: 'Ultrasonic Comforter 140 GSM (Microfiber)',
      slug: 'ultrasonic-comforter-140-gsm-microfiber',
      catSlug: 'duvets-covers-comforters',
      description: 'Premium Microfiber Shell, 140 GSM (Total Weight: 1.6 kg), Ultrasonic Welded Embossing. Heavy-duty seams, dense cozy fill.',
      unit: 'PIECE',
      reorderLevel: 25,
      defaultSellingPriceMinor: 169900,
      defaultCostMinor: 88000,
      variants: [
        { sku: 'ME-UC-140-KNG', name: 'King (108 x 108 inches)', size: '108 x 108"', color: 'Embossed White', gsm: 140, weave: 'Ultrasonic Welded', fabric: 'Microfiber Shell', price: 189900, cost: 98000, reorder: 25 },
        { sku: 'ME-UC-140-STD', name: 'Standard (78 x 90 inches)', size: '78 x 90"', color: 'Embossed White', gsm: 140, weave: 'Ultrasonic Welded', fabric: 'Microfiber Shell', price: 149900, cost: 78000, reorder: 20 },
        { sku: 'ME-UC-140-LRG', name: 'Large (90 x 90 inches)', size: '90 x 90"', color: 'Embossed White', gsm: 140, weave: 'Ultrasonic Welded', fabric: 'Microfiber Shell', price: 169900, cost: 88000, reorder: 25 },
      ],
    },

    // --- SECTION 03: MATTRESS PROTECTION ---
    {
      name: 'Quilted Mattress Protector 300 GSM',
      slug: 'quilted-mattress-protector-300-gsm',
      catSlug: 'mattress-protection',
      description: 'Multi-Layer Quilted Cushion, 300 GSM Heavy Cushioning, Elasticated 360-Degree Grip Skirt. Anti-allergen hygienic barrier.',
      unit: 'PIECE',
      reorderLevel: 20,
      defaultSellingPriceMinor: 169900,
      defaultCostMinor: 88000,
      variants: [
        { sku: 'ME-MP-300-KNG', name: 'King (78 x 78 inches)', size: '78 x 78"', color: 'White', gsm: 300, weave: 'Diamond Quilted', fabric: 'Multi-Layer Quilted Cushion', price: 189900, cost: 98000, reorder: 25 },
        { sku: 'ME-MP-300-QEN', name: 'Queen (72 x 78 inches)', size: '72 x 78"', color: 'White', gsm: 300, weave: 'Diamond Quilted', fabric: 'Multi-Layer Quilted Cushion', price: 169900, cost: 88000, reorder: 25 },
        { sku: 'ME-MP-300-SGL', name: 'Single (48 x 78 inches)', size: '48 x 78"', color: 'White', gsm: 300, weave: 'Diamond Quilted', fabric: 'Multi-Layer Quilted Cushion', price: 129900, cost: 68000, reorder: 20 },
      ],
    },
    {
      name: 'Terry Waterproof Mattress Protector 220 GSM',
      slug: 'terry-waterproof-mattress-protector-220-gsm',
      catSlug: 'mattress-protection',
      description: 'Absorbent Terry with Breathable TPU Backing, 220 GSM, Full Fitted Stretch Skirt. 100% waterproof, silent, no crinkle sound.',
      unit: 'PIECE',
      reorderLevel: 20,
      defaultSellingPriceMinor: 129900,
      defaultCostMinor: 68000,
      variants: [
        { sku: 'ME-MP-TPU-KNG', name: 'King (78 x 78 inches)', size: '78 x 78"', color: 'White', gsm: 220, weave: 'Terry + TPU', fabric: 'Cotton Terry + Breathable TPU', price: 149900, cost: 78000, reorder: 25 },
        { sku: 'ME-MP-TPU-QEN', name: 'Queen (72 x 78 inches)', size: '72 x 78"', color: 'White', gsm: 220, weave: 'Terry + TPU', fabric: 'Cotton Terry + Breathable TPU', price: 129900, cost: 68000, reorder: 25 },
        { sku: 'ME-MP-TPU-SGL', name: 'Single (48 x 78 inches)', size: '48 x 78"', color: 'White', gsm: 220, weave: 'Terry + TPU', fabric: 'Cotton Terry + Breathable TPU', price: 99900, cost: 52000, reorder: 20 },
      ],
    },

    // --- SECTION 04: PILLOWS & CUSHIONS ---
    {
      name: 'Recron Hotel King Pillow 750 GM',
      slug: 'recron-hotel-king-pillow-750-gm',
      catSlug: 'pillows-cushions',
      description: '100% Virgin Siliconized Recron Fiber, 17 x 27 Inches (King), 750 gm Firm Plush Fill. Ergonomic neck support, clump-free loft.',
      unit: 'PIECE',
      reorderLevel: 40,
      defaultSellingPriceMinor: 54900,
      defaultCostMinor: 28000,
      variants: [
        { sku: 'ME-PL-750-KNG', name: 'King Pillow (17 x 27 inches, 750 gm)', size: '17 x 27"', color: 'White', gsm: 750, weave: 'Siliconized Fiber', fabric: '100% Virgin Siliconized Recron', price: 54900, cost: 28000, reorder: 50 },
      ],
    },
    {
      name: 'Recron Hotel Standard Pillow 550 GM',
      slug: 'recron-hotel-standard-pillow-550-gm',
      catSlug: 'pillows-cushions',
      description: 'Virgin Siliconized Recron Fiber, 16 x 24 Inches (Standard), 550 gm Medium Plush Fill. Hypoallergenic and machine washable.',
      unit: 'PIECE',
      reorderLevel: 40,
      defaultSellingPriceMinor: 44900,
      defaultCostMinor: 22000,
      variants: [
        { sku: 'ME-PL-550-STD', name: 'Standard Pillow (16 x 24 inches, 550 gm)', size: '16 x 24"', color: 'White', gsm: 550, weave: 'Siliconized Fiber', fabric: 'Virgin Siliconized Recron', price: 44900, cost: 22000, reorder: 50 },
      ],
    },
    {
      name: 'Recron Square Cushion Insert 350 GM',
      slug: 'recron-square-cushion-insert-350-gm',
      catSlug: 'pillows-cushions',
      description: 'Virgin Recron Conjugated Fiber, 16 x 16 Inches (Square), 350 gm Plump Fill. High bounce, knife-edge tailored sharp corners.',
      unit: 'PIECE',
      reorderLevel: 40,
      defaultSellingPriceMinor: 29900,
      defaultCostMinor: 14000,
      variants: [
        { sku: 'ME-CS-350-SQR', name: 'Square Cushion Insert (16 x 16 inches, 350 gm)', size: '16 x 16"', color: 'White', gsm: 350, weave: 'Conjugated Fiber', fabric: 'Virgin Recron Conjugated', price: 29900, cost: 14000, reorder: 50 },
      ],
    },

    // --- SECTION 05: BATH MAT COLLECTION ---
    {
      name: 'Heavy Pure Cotton Bath Mat 400 GSM',
      slug: 'heavy-pure-cotton-bath-mat-400-gsm',
      catSlug: 'bath-mats',
      description: '100% Ring-Spun Pure Cotton, 400 GSM (350 gm total weight), Embossed Greek Key Border Frame. Heavy absorbency and secure floor grip.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 39900,
      defaultCostMinor: 19000,
      variants: [
        { sku: 'ME-BM-400-WHT', name: 'Bath Mat (20 x 30 inches, 350 gm)', size: '20 x 30"', color: 'Pure White', gsm: 400, weave: 'Greek Key Jacquard Border', fabric: '100% Ring-Spun Pure Cotton', price: 39900, cost: 19000, reorder: 40 },
      ],
    },
    {
      name: 'Pure Cotton Bath Mat 300 GSM',
      slug: 'pure-cotton-bath-mat-300-gsm',
      catSlug: 'bath-mats',
      description: '100% Pure Cotton, 300 GSM (290 gm total weight), Classic Greek Jacquard Border. Soft underfoot and quick turnaround.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 32900,
      defaultCostMinor: 16000,
      variants: [
        { sku: 'ME-BM-300-WHT', name: 'Bath Mat (20 x 30 inches, 290 gm)', size: '20 x 30"', color: 'Pure White', gsm: 300, weave: 'Classic Greek Jacquard', fabric: '100% Pure Cotton', price: 32900, cost: 16000, reorder: 40 },
      ],
    },

    // --- SECTION 06: TOWEL COLLECTION ---
    {
      name: 'Pure Cotton Bath Towel 600 GM (Luxury Heavyweight)',
      slug: 'pure-cotton-bath-towel-600-gm',
      catSlug: 'towel-collection',
      description: '100% Combed Pure Cotton, 600 gm Luxury Heavyweight, 30 x 60 Inches. Maximum absorption, ultra-plush pile, double-needle stitched hems.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 74900,
      defaultCostMinor: 38000,
      variants: [
        { sku: 'ME-TW-COT-BT600', name: 'Bath Towel (30 x 60 inches, 600 gm)', size: '30 x 60"', color: 'Pure White', gsm: 600, weave: 'Plush Terry', fabric: '100% Combed Pure Cotton', price: 74900, cost: 38000, reorder: 40 },
      ],
    },
    {
      name: 'Pure Cotton Bath Towel 550 GM (Executive Weight)',
      slug: 'pure-cotton-bath-towel-550-gm',
      catSlug: 'towel-collection',
      description: '100% Pure Cotton, 550 gm Executive Weight, 30 x 60 Inches. Plush softness, quick drying, durable weave for high wash endurance.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 64900,
      defaultCostMinor: 33000,
      variants: [
        { sku: 'ME-TW-COT-BT550', name: 'Bath Towel (30 x 60 inches, 550 gm)', size: '30 x 60"', color: 'Pure White', gsm: 550, weave: 'Plush Terry', fabric: '100% Pure Cotton', price: 64900, cost: 33000, reorder: 40 },
      ],
    },
    {
      name: 'Pure Cotton Bath Towel 500 GM (Standard Commercial)',
      slug: 'pure-cotton-bath-towel-500-gm',
      catSlug: 'towel-collection',
      description: '100% Pure Cotton, 500 gm Standard Commercial, 30 x 60 Inches. Soft & breathable everyday hospitality standard.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 57900,
      defaultCostMinor: 29000,
      variants: [
        { sku: 'ME-TW-COT-BT500', name: 'Bath Towel (30 x 60 inches, 500 gm)', size: '30 x 60"', color: 'Pure White', gsm: 500, weave: 'Standard Terry', fabric: '100% Pure Cotton', price: 57900, cost: 29000, reorder: 40 },
      ],
    },
    {
      name: 'Pure Cotton Hand Towel 150 GM (Compact Luxury)',
      slug: 'pure-cotton-hand-towel-150-gm',
      catSlug: 'towel-collection',
      description: '100% Pure Cotton, 150 gm Compact Luxury, 16 x 24 Inches. Convenient vanity size, highly absorbent, soft combed cotton feel.',
      unit: 'PIECE',
      reorderLevel: 40,
      defaultSellingPriceMinor: 19900,
      defaultCostMinor: 9500,
      variants: [
        { sku: 'ME-TW-COT-HT150', name: 'Hand Towel (16 x 24 inches, 150 gm)', size: '16 x 24"', color: 'Pure White', gsm: 150, weave: 'Soft Terry', fabric: '100% Pure Cotton', price: 19900, cost: 9500, reorder: 50 },
      ],
    },
    {
      name: 'Commercial Poly-Cotton Bath Towel 600 GM (Heavy Duty)',
      slug: 'commercial-poly-cotton-bath-towel-600-gm',
      catSlug: 'towel-collection',
      description: 'Poly-Cotton Performance Blend, 600 gm Heavy Duty, 30 x 60 Inches. High tensile strength, shrink-resistant, fast commercial drying.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 62900,
      defaultCostMinor: 31000,
      variants: [
        { sku: 'ME-TW-PC-BT600', name: 'Bath Towel (30 x 60 inches, 600 gm)', size: '30 x 60"', color: 'White', gsm: 600, weave: 'Heavy Duty Blend', fabric: 'Poly-Cotton Performance Blend', price: 62900, cost: 31000, reorder: 40 },
      ],
    },
    {
      name: 'Commercial Poly-Cotton Bath Towel 550 GM',
      slug: 'commercial-poly-cotton-bath-towel-550-gm',
      catSlug: 'towel-collection',
      description: 'Poly-Cotton Performance Blend, 550 gm, 30 x 60 Inches. Durable blend, high fiber retention, bright color retention.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 54900,
      defaultCostMinor: 27000,
      variants: [
        { sku: 'ME-TW-PC-BT550', name: 'Bath Towel (30 x 60 inches, 550 gm)', size: '30 x 60"', color: 'White', gsm: 550, weave: 'Performance Terry', fabric: 'Poly-Cotton Performance Blend', price: 54900, cost: 27000, reorder: 40 },
      ],
    },
    {
      name: 'Commercial Poly-Cotton Bath Towel 500 GM (Commercial Utility)',
      slug: 'commercial-poly-cotton-bath-towel-500-gm',
      catSlug: 'towel-collection',
      description: 'Poly-Cotton Blend, 500 gm, 30 x 60 Inches. Economy pick, withstands 200+ industrial wash cycles, rapid turnaround.',
      unit: 'PIECE',
      reorderLevel: 30,
      defaultSellingPriceMinor: 47900,
      defaultCostMinor: 23000,
      variants: [
        { sku: 'ME-TW-PC-BT500', name: 'Bath Towel (30 x 60 inches, 500 gm)', size: '30 x 60"', color: 'White', gsm: 500, weave: 'Commercial Terry', fabric: 'Poly-Cotton Blend', price: 47900, cost: 23000, reorder: 40 },
      ],
    },
    {
      name: 'Commercial Poly-Cotton Hand Towel 150 GM',
      slug: 'commercial-poly-cotton-hand-towel-150-gm',
      catSlug: 'towel-collection',
      description: 'Poly-Cotton Blend, 150 gm, 16 x 24 Inches. Stain resistant, easy industrial release, high cycle endurance.',
      unit: 'PIECE',
      reorderLevel: 40,
      defaultSellingPriceMinor: 16900,
      defaultCostMinor: 8000,
      variants: [
        { sku: 'ME-TW-PC-HT150', name: 'Hand Towel (16 x 24 inches, 150 gm)', size: '16 x 24"', color: 'White', gsm: 150, weave: 'Commercial Terry', fabric: 'Poly-Cotton Blend', price: 16900, cost: 8000, reorder: 50 },
      ],
    },

    // --- SECTION 07: BED RUNNERS & ACCENTS ---
    {
      name: 'Plain Velvet Bed Runner & Cushion Set (Holland Velvet)',
      slug: 'plain-velvet-bed-runner-cushion-set',
      catSlug: 'bed-runners-accents',
      description: 'Premium Holland Velvet (Solid Smooth), Runner + 2 Cushion Covers. Silky velvet sheen, stain barrier, wrinkle-free finish.',
      unit: 'SET',
      reorderLevel: 20,
      defaultSellingPriceMinor: 219900,
      defaultCostMinor: 110000,
      variants: [
        { sku: 'ME-RN-PLN-SET-GRN', name: 'Emerald Green Set (Runner 16x92" + 2 Cushions 18x18")', size: 'Set (16x92" + 2x 18x18")', color: 'Emerald Green', weave: 'Smooth Velvet', fabric: 'Premium Holland Velvet', price: 219900, cost: 110000, reorder: 25 },
        { sku: 'ME-RN-PLN-SET-NVY', name: 'Royal Navy Set (Runner 16x92" + 2 Cushions 18x18")', size: 'Set (16x92" + 2x 18x18")', color: 'Royal Navy', weave: 'Smooth Velvet', fabric: 'Premium Holland Velvet', price: 219900, cost: 110000, reorder: 25 },
        { sku: 'ME-RN-PLN-SET-MRN', name: 'Ruby Maroon Set (Runner 16x92" + 2 Cushions 18x18")', size: 'Set (16x92" + 2x 18x18")', color: 'Ruby Maroon', weave: 'Smooth Velvet', fabric: 'Premium Holland Velvet', price: 219900, cost: 110000, reorder: 20 },
        { sku: 'ME-RN-PLN-RNR', name: 'Single Bed Runner (16 x 92 inches)', size: '16 x 92"', color: 'Emerald Green', weave: 'Smooth Velvet', fabric: 'Premium Holland Velvet', price: 149900, cost: 75000, reorder: 25 },
        { sku: 'ME-RN-PLN-CSH', name: 'Pair of Cushion Covers (18 x 18 inches)', size: '18 x 18" (Pair)', color: 'Emerald Green', weave: 'Smooth Velvet', fabric: 'Premium Holland Velvet', price: 89900, cost: 42000, reorder: 30 },
      ],
    },
    {
      name: 'Quilted Velvet Bed Runner & Cushion Set (Holland Velvet)',
      slug: 'quilted-velvet-bed-runner-cushion-set',
      catSlug: 'bed-runners-accents',
      description: 'Holland Quilted Velvet (Designer Quilted Diamond Pattern), Runner + 2 Cushion Covers. Modern boutique hotel aesthetic.',
      unit: 'SET',
      reorderLevel: 20,
      defaultSellingPriceMinor: 249900,
      defaultCostMinor: 125000,
      variants: [
        { sku: 'ME-RN-QLT-SET-BLU', name: 'Sapphire Blue Set (Runner 16x92" + 2 Cushions 18x18")', size: 'Set (16x92" + 2x 18x18")', color: 'Sapphire Blue', weave: 'Diamond Quilted Velvet', fabric: 'Holland Quilted Velvet', price: 249900, cost: 125000, reorder: 25 },
        { sku: 'ME-RN-QLT-SET-MRN', name: 'Wine Maroon Set (Runner 16x92" + 2 Cushions 18x18")', size: 'Set (16x92" + 2x 18x18")', color: 'Wine Maroon', weave: 'Diamond Quilted Velvet', fabric: 'Holland Quilted Velvet', price: 249900, cost: 125000, reorder: 20 },
        { sku: 'ME-RN-QLT-SET-KNG', name: 'King Bed Runner Quilted (108 x 16 inches)', size: '108 x 16"', color: 'Sapphire Blue', weave: 'Diamond Quilted Velvet', fabric: 'Holland Quilted Velvet', price: 189900, cost: 95000, reorder: 20 },
        { sku: 'ME-RN-QLT-SET-CSH', name: 'Pair of Quilted Cushions (18 x 18 inches)', size: '18 x 18" (Pair)', color: 'Sapphire Blue', weave: 'Diamond Quilted Velvet', fabric: 'Holland Quilted Velvet', price: 99900, cost: 48000, reorder: 30 },
      ],
    },
  ];

  let totalProductsCreated = 0;
  let allVariants: any[] = [];
  const createdProductsMap: Record<string, any> = {};

  for (const def of catalogDefinitions) {
    const categoryId = catMap[def.catSlug];
    const imagePath = `/products/${def.slug}.jpg`;

    const product = await Product.create({
      name: def.name,
      slug: def.slug,
      categoryId,
      description: def.description,
      brand: 'MiEstilo',
      unit: def.unit,
      imageUrls: [imagePath],
      reorderLevel: def.reorderLevel,
      defaultSellingPriceMinor: def.defaultSellingPriceMinor,
      defaultCostMinor: def.defaultCostMinor,
      isActive: true,
    });

    createdProductsMap[def.slug] = product;
    totalProductsCreated++;

    for (const v of def.variants) {
      const variant = await ProductVariant.create({
        productId: product._id,
        sku: v.sku,
        variantName: v.name,
        attributes: {
          size: v.size,
          color: v.color,
          fabric: v.fabric,
          gsm: (v as any).gsm,
          threadCount: (v as any).tc,
          weave: v.weave,
        },
        unit: def.unit,
        reorderLevel: v.reorder,
        costMinor: v.cost,
        sellingPriceMinor: v.price,
        isActive: true,
      });
      allVariants.push(variant);
    }
  }

  console.log(`[Seed] Created ${totalProductsCreated} products with ${allVariants.length} sellable SKUs.`);

  console.log('[Seed] Populating initial warehouse stock balances and ledger movements...');
  const bomWarehouse = warehouses[0]; // Mumbai Central
  const delWarehouse = warehouses[1]; // Delhi Northern
  const blrWarehouse = warehouses[2]; // Bengaluru Southern

  for (const v of allVariants) {
    // Generate realistic stock amounts
    const bomQty = 60 + Math.floor(Math.random() * 80);
    const delQty = 40 + Math.floor(Math.random() * 50);
    const blrQty = 30 + Math.floor(Math.random() * 40);

    // 1. Mumbai Stock Balance
    await StockBalance.create({
      skuId: v._id,
      warehouseId: bomWarehouse._id,
      onHand: bomQty,
      reserved: 0,
      damaged: 0,
      quarantined: 0,
    });

    const mov1 = await getNextSequence('stock_movement', 'ML-MOV');
    await StockMovement.create({
      movementNumber: mov1,
      type: 'RECEIPT',
      skuId: v._id,
      warehouseId: bomWarehouse._id,
      quantityDelta: bomQty,
      reservedDelta: 0,
      referenceType: 'RECEIPT',
      referenceId: 'ME-REC-INIT-BOM',
      reasonCode: 'OPENING_BALANCE',
      notes: 'Initial warehouse opening stock receipt from factory',
      actorUserId: users[0]._id.toString(),
      actorName: users[0].name,
      occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });

    // 2. Delhi Stock Balance
    await StockBalance.create({
      skuId: v._id,
      warehouseId: delWarehouse._id,
      onHand: delQty,
      reserved: 0,
      damaged: 0,
      quarantined: 0,
    });

    const mov2 = await getNextSequence('stock_movement', 'ML-MOV');
    await StockMovement.create({
      movementNumber: mov2,
      type: 'RECEIPT',
      skuId: v._id,
      warehouseId: delWarehouse._id,
      quantityDelta: delQty,
      reservedDelta: 0,
      referenceType: 'RECEIPT',
      referenceId: 'ME-REC-INIT-DEL',
      reasonCode: 'OPENING_BALANCE',
      notes: 'Northern depot initial opening stock receipt',
      actorUserId: users[0]._id.toString(),
      actorName: users[0].name,
      occurredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    });

    // 3. Bengaluru Stock Balance
    await StockBalance.create({
      skuId: v._id,
      warehouseId: blrWarehouse._id,
      onHand: blrQty,
      reserved: 0,
      damaged: 0,
      quarantined: 0,
    });

    const mov3 = await getNextSequence('stock_movement', 'ML-MOV');
    await StockMovement.create({
      movementNumber: mov3,
      type: 'RECEIPT',
      skuId: v._id,
      warehouseId: blrWarehouse._id,
      quantityDelta: blrQty,
      reservedDelta: 0,
      referenceType: 'RECEIPT',
      referenceId: 'ME-REC-INIT-BLR',
      reasonCode: 'OPENING_BALANCE',
      notes: 'Southern logistics hub opening stock receipt',
      actorUserId: users[0]._id.toString(),
      actorName: users[0].name,
      occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });
  }

  console.log('[Seed] Creating demo luxury hotel sales orders with live reservations...');
  // Find key SKUs for orders
  const king400TC = allVariants.find((v: any) => v.sku === 'ME-BL-400-KNG')!;
  const towel600GM = allVariants.find((v: any) => v.sku === 'ME-TW-COT-BT600')!;
  const duvet300 = allVariants.find((v: any) => v.sku === 'ME-DV-300-KNG')!;
  const pillow750 = allVariants.find((v: any) => v.sku === 'ME-PL-750-KNG')!;

  // Order 1: Taj Lands End Mumbai
  const taj = customers[0];
  const orderNumber1 = await getNextSequence('sales_order', 'ML-ORD');
  const line1Qty = 20;
  const line2Qty = 30;

  await SalesOrder.create({
    orderNumber: orderNumber1,
    customerId: taj._id,
    customerSnapshot: {
      customerCode: taj.customerCode,
      companyName: taj.companyName,
      contactName: taj.contactName,
      email: taj.email,
      phone: taj.phone,
    },
    shipToSnapshot: {
      street: taj.shippingAddresses[0].street,
      city: taj.shippingAddresses[0].city,
      state: taj.shippingAddresses[0].state,
      postalCode: taj.shippingAddresses[0].postalCode,
    },
    warehouseId: bomWarehouse._id,
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'CONFIRMED',
    lines: [
      {
        skuId: king400TC._id,
        skuSnapshot: {
          sku: king400TC.sku,
          name: 'Pure Cotton Bedsheet 400 TC',
          variantName: king400TC.variantName,
          unit: 'PIECE',
          size: king400TC.attributes.size,
          color: king400TC.attributes.color,
          fabric: king400TC.attributes.fabric,
          threadCount: king400TC.attributes.threadCount,
        },
        orderedQty: line1Qty,
        reservedQty: line1Qty,
        dispatchedQty: 0,
        returnedQty: 0,
        unitPriceMinor: king400TC.sellingPriceMinor,
        discountMinor: 0,
        taxRatePercent: 12,
        taxAmountMinor: Math.round((line1Qty * king400TC.sellingPriceMinor * 12) / 100),
        lineTotalMinor: Math.round(line1Qty * king400TC.sellingPriceMinor * 1.12),
      },
      {
        skuId: towel600GM._id,
        skuSnapshot: {
          sku: towel600GM.sku,
          name: 'Pure Cotton Bath Towel 600 GM (Luxury Heavyweight)',
          variantName: towel600GM.variantName,
          unit: 'PIECE',
          size: towel600GM.attributes.size,
          color: towel600GM.attributes.color,
          fabric: towel600GM.attributes.fabric,
          gsm: towel600GM.attributes.gsm,
        },
        orderedQty: line2Qty,
        reservedQty: line2Qty,
        dispatchedQty: 0,
        returnedQty: 0,
        unitPriceMinor: towel600GM.sellingPriceMinor,
        discountMinor: 0,
        taxRatePercent: 12,
        taxAmountMinor: Math.round((line2Qty * towel600GM.sellingPriceMinor * 12) / 100),
        lineTotalMinor: Math.round(line2Qty * towel600GM.sellingPriceMinor * 1.12),
      },
    ],
    currency: 'INR',
    subtotalMinor: line1Qty * king400TC.sellingPriceMinor + line2Qty * towel600GM.sellingPriceMinor,
    discountTotalMinor: 0,
    taxTotalMinor: Math.round(((line1Qty * king400TC.sellingPriceMinor + line2Qty * towel600GM.sellingPriceMinor) * 12) / 100),
    grandTotalMinor: Math.round((line1Qty * king400TC.sellingPriceMinor + line2Qty * towel600GM.sellingPriceMinor) * 1.12),
    notes: 'Urgent restocking for presidential suites and club rooms.',
    createdBy: users[3].name,
    confirmedBy: users[3].name,
    confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });

  // Apply reservations to StockBalance
  await StockBalance.findOneAndUpdate(
    { skuId: king400TC._id, warehouseId: bomWarehouse._id },
    { $inc: { reserved: line1Qty } }
  );
  await StockBalance.findOneAndUpdate(
    { skuId: towel600GM._id, warehouseId: bomWarehouse._id },
    { $inc: { reserved: line2Qty } }
  );

  // Order 2: The Oberoi New Delhi
  const oberoi = customers[1];
  const orderNumber2 = await getNextSequence('sales_order', 'ML-ORD');
  const line3Qty = 15;
  const line4Qty = 25;

  await SalesOrder.create({
    orderNumber: orderNumber2,
    customerId: oberoi._id,
    customerSnapshot: {
      customerCode: oberoi.customerCode,
      companyName: oberoi.companyName,
      contactName: oberoi.contactName,
      email: oberoi.email,
      phone: oberoi.phone,
    },
    shipToSnapshot: {
      street: oberoi.shippingAddresses[0].street,
      city: oberoi.shippingAddresses[0].city,
      state: oberoi.shippingAddresses[0].state,
      postalCode: oberoi.shippingAddresses[0].postalCode,
    },
    warehouseId: delWarehouse._id,
    orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'CONFIRMED',
    lines: [
      {
        skuId: duvet300._id,
        skuSnapshot: {
          sku: duvet300.sku,
          name: 'Microfiber Duvet 300 GSM (All-Season)',
          variantName: duvet300.variantName,
          unit: 'PIECE',
          size: duvet300.attributes.size,
          color: duvet300.attributes.color,
          fabric: duvet300.attributes.fabric,
          gsm: duvet300.attributes.gsm,
        },
        orderedQty: line3Qty,
        reservedQty: line3Qty,
        dispatchedQty: 0,
        returnedQty: 0,
        unitPriceMinor: duvet300.sellingPriceMinor,
        discountMinor: 0,
        taxRatePercent: 12,
        taxAmountMinor: Math.round((line3Qty * duvet300.sellingPriceMinor * 12) / 100),
        lineTotalMinor: Math.round(line3Qty * duvet300.sellingPriceMinor * 1.12),
      },
      {
        skuId: pillow750._id,
        skuSnapshot: {
          sku: pillow750.sku,
          name: 'Recron Hotel King Pillow 750 GM',
          variantName: pillow750.variantName,
          unit: 'PIECE',
          size: pillow750.attributes.size,
          color: pillow750.attributes.color,
          fabric: pillow750.attributes.fabric,
          gsm: pillow750.attributes.gsm,
        },
        orderedQty: line4Qty,
        reservedQty: line4Qty,
        dispatchedQty: 0,
        returnedQty: 0,
        unitPriceMinor: pillow750.sellingPriceMinor,
        discountMinor: 0,
        taxRatePercent: 12,
        taxAmountMinor: Math.round((line4Qty * pillow750.sellingPriceMinor * 12) / 100),
        lineTotalMinor: Math.round(line4Qty * pillow750.sellingPriceMinor * 1.12),
      },
    ],
    currency: 'INR',
    subtotalMinor: line3Qty * duvet300.sellingPriceMinor + line4Qty * pillow750.sellingPriceMinor,
    discountTotalMinor: 0,
    taxTotalMinor: Math.round(((line3Qty * duvet300.sellingPriceMinor + line4Qty * pillow750.sellingPriceMinor) * 12) / 100),
    grandTotalMinor: Math.round((line3Qty * duvet300.sellingPriceMinor + line4Qty * pillow750.sellingPriceMinor) * 1.12),
    notes: 'Premium luxury wing refresh order.',
    createdBy: users[3].name,
    confirmedBy: users[3].name,
    confirmedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  });

  // Apply reservations to StockBalance
  await StockBalance.findOneAndUpdate(
    { skuId: duvet300._id, warehouseId: delWarehouse._id },
    { $inc: { reserved: line3Qty } }
  );
  await StockBalance.findOneAndUpdate(
    { skuId: pillow750._id, warehouseId: delWarehouse._id },
    { $inc: { reserved: line4Qty } }
  );

  console.log('[Seed] Database seeding completed successfully!');
  return {
    usersCount: users.length,
    categoriesCount: categories.length,
    warehousesCount: warehouses.length,
    productsCount: totalProductsCreated,
    variantsCount: allVariants.length,
    customersCount: customers.length,
    ordersCount: 2,
  };
}

// Run directly if called as a script
if (require.main === module) {
  runSeed()
    .then((res) => {
      console.log('[Seed Done]', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
