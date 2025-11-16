import { Order, OrderItem, OrderStatus, OrderSource } from './types';
import { Timestamp } from 'firebase/firestore';

// Sample products for order items
const sampleProducts = [
  { name: 'Lavender Essential Oil 10ml', price: 850 },
  { name: 'Rose Water Toner 200ml', price: 1200 },
  { name: 'Vanilla Scented Candle', price: 650 },
  { name: 'Peppermint Body Lotion 250ml', price: 950 },
  { name: 'Citrus Air Freshener Spray', price: 500 },
  { name: 'Jasmine Perfume 50ml', price: 2500 },
  { name: 'Sandalwood Incense Sticks (Pack of 20)', price: 300 },
  { name: 'Eucalyptus Shower Gel 300ml', price: 800 },
  { name: 'Chamomile Tea Light Candles (Set of 6)', price: 450 },
  { name: 'Coconut Body Butter 200g', price: 1100 },
];

// Sample customers
const sampleCustomers = [
  { name: 'Mary Wanjiru', email: 'mary.wanjiru@email.com', phone: '+254712345678' },
  { name: 'John Kamau', email: 'john.kamau@email.com', phone: '+254723456789' },
  { name: 'Grace Akinyi', email: 'grace.akinyi@email.com', phone: '+254734567890' },
  { name: 'Peter Omondi', email: 'peter.omondi@email.com', phone: '+254745678901' },
  { name: 'Sarah Njeri', email: 'sarah.njeri@email.com', phone: '+254756789012' },
  { name: 'David Kipchoge', email: 'david.kipchoge@email.com', phone: '+254767890123' },
  { name: 'Elizabeth Wambui', email: 'elizabeth.wambui@email.com', phone: '+254778901234' },
  { name: 'James Mwangi', email: 'james.mwangi@email.com', phone: '+254789012345' },
  { name: 'Lucy Adhiambo', email: 'lucy.adhiambo@email.com', phone: '+254790123456' },
  { name: 'Michael Otieno', email: 'michael.otieno@email.com', phone: '+254701234567' },
];

// Helper function to generate random date within last 30 days
const getRandomRecentDate = (): Date => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

// Helper function to generate random future date (1-14 days)
const getRandomFutureDate = (): Date => {
  const now = new Date();
  const daysAhead = Math.floor(Math.random() * 14) + 1;
  const date = new Date(now);
  date.setDate(date.getDate() + daysAhead);
  return date;
};

// Helper function to get random element
const getRandomElement = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to generate order items
const generateOrderItems = (): OrderItem[] => {
  const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
  const items: OrderItem[] = [];
  const usedProducts = new Set<string>();

  for (let i = 0; i < itemCount; i++) {
    let product = getRandomElement(sampleProducts);
    // Avoid duplicate products
    while (usedProducts.has(product.name) && usedProducts.size < sampleProducts.length) {
      product = getRandomElement(sampleProducts);
    }
    usedProducts.add(product.name);

    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
    const unitPrice = product.price;
    const totalPrice = unitPrice * quantity;

    items.push({
      productId: `prod-${i + 1}`,
      productName: product.name,
      quantity,
      unitPrice,
      discount: 0,
      totalPrice,
      notes: Math.random() > 0.7 ? 'Gift wrap requested' : undefined,
    });
  }

  return items;
};

// Generate mock orders
export const generateMockOrders = (count: number = 15): Order[] => {
  const orders: Order[] = [];
  const statuses = Object.values(OrderStatus);
  const sources = Object.values(OrderSource);
  const deliveryMethods: Array<'pickup' | 'delivery'> = ['pickup', 'delivery'];

  for (let i = 0; i < count; i++) {
    const customer = getRandomElement(sampleCustomers);
    const items = generateOrderItems();
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountPercentage = Math.random() > 0.8 ? 10 : 0; // 10% discount sometimes
    const discountAmount = Math.floor(subtotal * (discountPercentage / 100));
    const tax = Math.round((subtotal - discountAmount) * 0.16); // 16% VAT
    const total = subtotal - discountAmount + tax;

    const status = getRandomElement(statuses);
    const source = getRandomElement(sources);
    const deliveryMethod = getRandomElement(deliveryMethods);
    const createdAt = getRandomRecentDate();
    
    // Only some orders are converted to invoices
    const isConverted = Math.random() > 0.6;
    
    // Only some orders are paid
    const isPaid = Math.random() > 0.7;

    const order: Order = {
      id: `order-${i + 1}`,
      orderNumber: `ORD-2025-${String(1000 + i).padStart(4, '0')}`,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      items,
      subtotal,
      discountPercentage,
      tax,
      total,
      status,
      source,
      deliveryMethod,
      deliveryAddress: deliveryMethod === 'delivery' 
        ? `${Math.floor(Math.random() * 1000)} ${getRandomElement(['Karen', 'Westlands', 'Kilimani', 'Lavington', 'Parklands'])} Road, Nairobi`
        : undefined,
      deliveryNotes: deliveryMethod === 'delivery' && Math.random() > 0.5
        ? getRandomElement(['Ring doorbell', 'Leave at gate', 'Call on arrival', 'Security at entrance'])
        : undefined,
      estimatedDeliveryDate: deliveryMethod === 'delivery' 
        ? Timestamp.fromDate(getRandomFutureDate())
        : undefined,
      isPaid,
      paymentMethod: isPaid ? getRandomElement(['cash', 'mpesa', 'bank_transfer']) : undefined,
      paymentReference: isPaid && Math.random() > 0.5 
        ? `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        : undefined,
      notes: Math.random() > 0.7 
        ? getRandomElement(['First time customer', 'Regular customer', 'Prefers morning delivery', 'Corporate client'])
        : undefined,
      invoiceId: isConverted ? `invoice-${i + 1}` : undefined,
      convertedAt: isConverted ? Timestamp.fromDate(new Date(createdAt.getTime() + 86400000)) : undefined, // 1 day after creation
      createdBy: source === OrderSource.PWA ? 'customer' : 'admin-staff',
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    orders.push(order);
  }

  // Sort by creation date (newest first)
  return orders.sort((a, b) => {
    const aDate = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : a.createdAt;
    const bDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt;
    return bDate.getTime() - aDate.getTime();
  });
};

// Export pre-generated mock data
export const mockOrders = generateMockOrders(15);
