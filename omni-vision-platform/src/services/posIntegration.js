// POS Integration Service for Loyverse and Square
// This service provides unified API access to different POS systems

class POSIntegrationService {
  constructor() {
    this.posType = null; // 'loyverse' or 'square'
    this.apiKey = null;
    this.baseURL = null;
    this.storeId = null;
  }

  // Initialize POS connection
  initialize(config) {
    this.posType = config.type;
    this.apiKey = config.apiKey;
    this.storeId = config.storeId;

    switch (config.type) {
      case 'loyverse':
        this.baseURL = 'https://api.loyverse.com/v1.0';
        break;
      case 'square':
        this.baseURL = 'https://connect.squareup.com/v2';
        break;
      default:
        throw new Error('Unsupported POS type');
    }

    return this;
  }

  // Get recent transactions
  async getRecentTransactions(limit = 50, startTime = null) {
    if (!this.apiKey) {
      console.warn('POS not configured, using mock data');
      return this.getMockTransactions();
    }

    try {
      switch (this.posType) {
        case 'loyverse':
          return await this.getLoyverseTransactions(limit, startTime);
        case 'square':
          return await this.getSquareTransactions(limit, startTime);
        default:
          return this.getMockTransactions();
      }
    } catch (error) {
      console.error('Error fetching POS transactions:', error);
      return this.getMockTransactions();
    }
  }

  // Loyverse API integration
  async getLoyverseTransactions(limit, startTime) {
    const endpoint = `${this.baseURL}/receipts`;
    const params = new URLSearchParams({
      limit: limit.toString(),
      store_id: this.storeId
    });

    if (startTime) {
      params.append('created_at_min', startTime);
    }

    const response = await fetch(`${endpoint}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Loyverse API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeLoyverseData(data.receipts || []);
  }

  // Square API integration
  async getSquareTransactions(limit, startTime) {
    const endpoint = `${this.baseURL}/payments`;
    const body = {
      limit,
      location_id: this.storeId
    };

    if (startTime) {
      body.begin_time = startTime;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Square-Version': '2023-12-13'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Square API error: ${response.status}`);
    }

    const data = await response.json();
    return this.normalizeSquareData(data.payments || []);
  }

  // Normalize Loyverse data to standard format
  normalizeLoyverseData(receipts) {
    return receipts.map(receipt => ({
      id: receipt.receipt_number,
      timestamp: receipt.created_at,
      items: receipt.line_items?.map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        price: item.gross_total,
        sku: item.sku
      })) || [],
      total: receipt.total_money,
      employee: receipt.employee_name,
      status: receipt.refund_for ? 'refunded' : 'completed',
      source: 'loyverse'
    }));
  }

  // Normalize Square data to standard format
  normalizeSquareData(payments) {
    return payments.map(payment => ({
      id: payment.id,
      timestamp: payment.created_at,
      items: [], // Square requires separate API call for line items
      total: payment.amount_money?.amount / 100, // Convert cents to dollars
      employee: payment.employee_id,
      status: payment.status.toLowerCase(),
      source: 'square'
    }));
  }

  // Mock transactions for testing/demo
  getMockTransactions() {
    const now = Date.now();
    return [
      {
        id: 'MOCK_001',
        timestamp: new Date(now - 300000).toISOString(), // 5 min ago
        items: [
          { name: 'Blue School Shirt', quantity: 2, price: 25.00, sku: 'UNI-SHT-BLU-M' },
          { name: 'Grey Trousers', quantity: 1, price: 35.00, sku: 'UNI-TRS-GRY-M' }
        ],
        total: 85.00,
        employee: 'Sarah Johnson',
        status: 'completed',
        source: 'mock'
      },
      {
        id: 'MOCK_002',
        timestamp: new Date(now - 900000).toISOString(), // 15 min ago
        items: [
          { name: 'School Tie', quantity: 3, price: 12.00, sku: 'UNI-TIE-001' }
        ],
        total: 36.00,
        employee: 'Michael Chen',
        status: 'completed',
        source: 'mock'
      },
      {
        id: 'MOCK_003',
        timestamp: new Date(now - 1800000).toISOString(), // 30 min ago
        items: [
          { name: 'PE Uniform Set', quantity: 1, price: 45.00, sku: 'UNI-PE-SET' }
        ],
        total: 45.00,
        employee: 'Sarah Johnson',
        status: 'completed',
        source: 'mock'
      }
    ];
  }

  // Check if an item was scanned recently
  async verifyItemScanned(itemName, timeWindow = 300000) { // 5 min default
    const startTime = new Date(Date.now() - timeWindow).toISOString();
    const transactions = await this.getRecentTransactions(50, startTime);

    for (const transaction of transactions) {
      const matchingItem = transaction.items.find(
        item => item.name.toLowerCase().includes(itemName.toLowerCase())
      );
      if (matchingItem) {
        return {
          found: true,
          transaction,
          item: matchingItem
        };
      }
    }

    return { found: false };
  }

  // Get sales statistics
  async getSalesStats(timeWindow = 3600000) { // 1 hour default
    const startTime = new Date(Date.now() - timeWindow).toISOString();
    const transactions = await this.getRecentTransactions(100, startTime);

    return {
      totalTransactions: transactions.length,
      totalRevenue: transactions.reduce((sum, t) => sum + t.total, 0),
      averageTransaction: transactions.length > 0 
        ? transactions.reduce((sum, t) => sum + t.total, 0) / transactions.length 
        : 0,
      topEmployee: this.getTopEmployee(transactions),
      itemsSold: transactions.reduce((sum, t) => sum + t.items.length, 0)
    };
  }

  // Helper to find top performing employee
  getTopEmployee(transactions) {
    const employeeStats = {};
    transactions.forEach(t => {
      if (!employeeStats[t.employee]) {
        employeeStats[t.employee] = { count: 0, revenue: 0 };
      }
      employeeStats[t.employee].count++;
      employeeStats[t.employee].revenue += t.total;
    });

    let topEmployee = { name: 'N/A', count: 0, revenue: 0 };
    Object.entries(employeeStats).forEach(([name, stats]) => {
      if (stats.revenue > topEmployee.revenue) {
        topEmployee = { name, ...stats };
      }
    });

    return topEmployee;
  }
}

// Export singleton instance
export const posService = new POSIntegrationService();

// Export configuration helper
export function configurePOS(type, apiKey, storeId) {
  return posService.initialize({ type, apiKey, storeId });
}

export default posService;
