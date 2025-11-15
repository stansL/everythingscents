import { Invoice, InvoiceItem, Customer, Category, InvoiceMetrics, DateOption } from './types';

// Sample customers data
export const mockCustomers: Customer[] = [
  { id: '1', name: 'Lindsey Curtis', email: 'lindsey.curtis@email.com', company: 'Curtis Design Co' },
  { id: '2', name: 'John Doe', email: 'john.doe@email.com', company: 'Doe Enterprises' },
  { id: '3', name: 'Jane Smith', email: 'jane.smith@email.com', company: 'Smith Solutions' },
  { id: '4', name: 'Michael Brown', email: 'michael.brown@email.com', company: 'Brown Industries' },
  { id: '5', name: 'Emily Davis', email: 'emily.davis@email.com', company: 'Davis Marketing' },
  { id: '6', name: 'Chris Wilson', email: 'chris.wilson@email.com', company: 'Wilson Tech' },
  { id: '7', name: 'Jessica Lee', email: 'jessica.lee@email.com', company: 'Lee Consulting' },
  { id: '8', name: 'David Kim', email: 'david.kim@email.com', company: 'Kim Development' },
  { id: '9', name: 'Sarah Clark', email: 'sarah.clark@email.com', company: 'Clark Creative' },
  { id: '10', name: 'Matthew Lewis', email: 'matthew.lewis@email.com', company: 'Lewis & Associates' },
  { id: '11', name: 'Amanda Rodriguez', email: 'amanda.rodriguez@email.com', company: 'Rodriguez Media' },
  { id: '12', name: 'James Taylor', email: 'james.taylor@email.com', company: 'Taylor Systems' },
  { id: '13', name: 'Lisa Anderson', email: 'lisa.anderson@email.com', company: 'Anderson Group' },
  { id: '14', name: 'Robert Johnson', email: 'robert.johnson@email.com', company: 'Johnson LLC' },
  { id: '15', name: 'Maria Garcia', email: 'maria.garcia@email.com', company: 'Garcia Innovations' }
];

// Sample categories
export const mockCategories: Category[] = [
  { id: '1', name: 'Web Design', description: 'Website design and development services', color: '#3B82F6' },
  { id: '2', name: 'Consulting', description: 'Business consulting services', color: '#10B981' },
  { id: '3', name: 'Marketing', description: 'Digital marketing and advertising', color: '#F59E0B' },
  { id: '4', name: 'Development', description: 'Software development services', color: '#8B5CF6' },
  { id: '5', name: 'Design', description: 'Graphic design and branding', color: '#EF4444' },
  { id: '6', name: 'Content', description: 'Content creation and copywriting', color: '#06B6D4' },
  { id: '7', name: 'SEO', description: 'Search engine optimization', color: '#84CC16' },
  { id: '8', name: 'Maintenance', description: 'Website and system maintenance', color: '#6B7280' },
  { id: '9', name: 'Training', description: 'Training and education services', color: '#F97316' },
  { id: '10', name: 'Support', description: 'Technical support services', color: '#EC4899' }
];

// Helper function to generate random date
const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to get random array element
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to generate mock invoice items
const generateMockItems = (count: number = 3): InvoiceItem[] => {
  const sampleProducts = [
    'Web Design Services', 'Logo Design', 'SEO Optimization', 'Content Writing', 
    'Social Media Management', 'E-commerce Setup', 'Website Maintenance', 
    'Digital Marketing Campaign', 'Brand Strategy', 'UI/UX Design',
    'Mobile App Development', 'Database Setup', 'SSL Certificate', 'Hosting Services'
  ];
  
  const items: InvoiceItem[] = [];
  for (let i = 0; i < count; i++) {
    const quantity = Math.floor(Math.random() * 10) + 1; // 1-10
    const rate = [2500, 5000, 7500, 10000, 15000, 20000, 25000][Math.floor(Math.random() * 7)]; // Various rates in cents
    const amount = quantity * rate;
    
    items.push({
      id: `item-${i + 1}`,
      description: getRandomElement(sampleProducts),
      quantity,
      rate,
      amount,
      discount: Math.random() < 0.3 ? Math.floor(amount * 0.1) : 0 // 30% chance of 10% discount
    });
  }
  
  return items;
};

// Generate mock invoices
export const generateMockInvoices = (count: number = 30): Invoice[] => {
  const invoices: Invoice[] = [];
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  for (let i = 1; i <= count; i++) {
    const customer = getRandomElement(mockCustomers);
    const category = getRandomElement(mockCategories);
    const issueDate = getRandomDate(oneYearAgo, now);
    const dueDate = new Date(issueDate.getTime() + (Math.random() * 180 + 15) * 24 * 60 * 60 * 1000); // 15-195 days after issue
    
    // Generate invoice items
    const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items
    const items = generateMockItems(itemCount);
    
    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + (item.amount - (item.discount || 0)), 0);
    
    // Calculate tax and discount
    const taxRate = 0.1; // 10% tax
    const taxAmount = Math.floor(subtotal * taxRate);
    const discountAmount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    
    // Total amount
    const amount = subtotal + taxAmount;
    
    // Determine status based on due date and randomness
    let status: 'paid' | 'unpaid' | 'draft';
    const daysSinceDue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (Math.random() < 0.15) {
      status = 'draft';
    } else if (daysSinceDue > 0 && Math.random() < 0.3) {
      status = 'unpaid'; // Some overdue invoices
    } else if (daysSinceDue < -30 && Math.random() < 0.2) {
      status = 'unpaid'; // Some future unpaid
    } else {
      status = Math.random() < 0.7 ? 'paid' : 'unpaid';
    }

    const invoice: Invoice = {
      id: `${323534 + i}`,
      clientName: customer.name,
      clientEmail: customer.email,
      clientAddress: `${Math.floor(Math.random() * 9999) + 1} Main St, Suite ${Math.floor(Math.random() * 500) + 1}\nCity, State 12345`,
      issueDate,
      dueDate,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      amount,
      status,
      category: category.name,
      description: `${category.name} services for ${customer.company}`,
      notes: Math.random() < 0.5 ? `Thank you for your business with ${customer.company}. Payment terms: Net 30 days.` : undefined,
      createdAt: issueDate,
      updatedAt: new Date()
    };

    invoices.push(invoice);
  }

  // Sort by issue date (newest first)
  return invoices.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
};

// Pre-generated mock data
export const mockInvoices = generateMockInvoices(30);

// Generate mock metrics based on the invoice data
export const generateMockMetrics = (invoices: Invoice[]): InvoiceMetrics => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Calculate due within 30 days
  const dueWithin30Days = invoices
    .filter(inv => inv.status === 'unpaid' && inv.dueDate <= thirtyDaysFromNow && inv.dueDate >= now)
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  // Calculate average payment time (mock calculation)
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const averagePaymentTime = paidInvoices.length > 0 
    ? paidInvoices.reduce((sum, inv) => {
        const paymentDays = Math.max(0, (inv.updatedAt.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + paymentDays;
      }, 0) / paidInvoices.length
    : 0;
  
  // Mock upcoming payout days
  const upcomingPayoutDays = 24;
  
  // Calculate total outstanding
  const totalOutstanding = invoices
    .filter(inv => inv.status === 'unpaid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return {
    dueWithin30Days: dueWithin30Days / 100, // Convert from cents to dollars
    averagePaymentTime: Math.round(averagePaymentTime * 10) / 10,
    upcomingPayoutDays,
    totalOutstanding: totalOutstanding / 100 // Convert from cents to dollars
  };
};

export const mockMetrics = generateMockMetrics(mockInvoices);

// Generate date options for filter dropdown
export const generateDateOptions = (): DateOption[] => {
  const options: DateOption[] = [];
  const now = new Date();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate options for current year and previous year
  for (let yearOffset = 0; yearOffset >= -2; yearOffset--) {
    const year = now.getFullYear() + yearOffset;
    
    // For current year, only include past and current month
    const endMonth = yearOffset === 0 ? now.getMonth() : 11;
    
    for (let month = endMonth; month >= 0; month--) {
      options.push({
        label: `${months[month]} ${year}`,
        value: {
          month: months[month].toLowerCase(),
          year: year.toString()
        }
      });
    }
  }

  return options;
};

export const mockDateOptions = generateDateOptions();

// Filter helper functions for the mock data
export const getInvoicesByStatus = (status: 'all' | 'paid' | 'unpaid' | 'draft'): Invoice[] => {
  if (status === 'all') return mockInvoices;
  return mockInvoices.filter(invoice => invoice.status === status);
};

export const searchInvoices = (invoices: Invoice[], searchTerm: string): Invoice[] => {
  if (!searchTerm.trim()) return invoices;
  
  const term = searchTerm.toLowerCase();
  return invoices.filter(invoice => 
    invoice.id.toLowerCase().includes(term) ||
    invoice.clientName.toLowerCase().includes(term) ||
    invoice.clientEmail?.toLowerCase().includes(term) ||
    invoice.category?.toLowerCase().includes(term) ||
    invoice.description?.toLowerCase().includes(term)
  );
};

// Export summary statistics
export const getInvoiceStats = () => {
  const total = mockInvoices.length;
  const paid = mockInvoices.filter(inv => inv.status === 'paid').length;
  const unpaid = mockInvoices.filter(inv => inv.status === 'unpaid').length;
  const draft = mockInvoices.filter(inv => inv.status === 'draft').length;
  
  return {
    total,
    paid,
    unpaid,
    draft,
    paidPercentage: Math.round((paid / total) * 100),
    unpaidPercentage: Math.round((unpaid / total) * 100),
    draftPercentage: Math.round((draft / total) * 100)
  };
};