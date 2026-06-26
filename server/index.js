import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `temp_${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Data file paths
const STOCK_FILE = path.join(__dirname, 'data', 'stock.json');
const BILLS_FILE = path.join(__dirname, 'data', 'bills.json');
const ITEM_DB_FILE = path.join(__dirname, 'data', 'item_db.json');

// Initialize data files
async function initializeDataFiles() {
  const dataDir = path.join(__dirname, 'data');

  try {
    await fs.mkdir(dataDir, { recursive: true });

    // Initialize stock file
    try {
      await fs.access(STOCK_FILE);
    } catch {
      const initialStock = {
        "apple": { "name": "Apple", "price": 2.50, "quantity": 100, "unit": "kg" },
        "banana": { "name": "Banana", "price": 1.80, "quantity": 50, "unit": "kg" },
        "orange": { "name": "Orange", "price": 3.00, "quantity": 75, "unit": "kg" },
        "milk": { "name": "Milk", "price": 4.20, "quantity": 30, "unit": "liters" },
        "bread": { "name": "Bread", "price": 2.80, "quantity": 20, "unit": "loaves" },
        "eggs": { "name": "Eggs", "price": 5.50, "quantity": 40, "unit": "dozen" },
        "chicken": { "name": "Chicken", "price": 12.99, "quantity": 25, "unit": "kg" },
        "rice": { "name": "Rice", "price": 8.75, "quantity": 60, "unit": "kg" },
        "tomato": { "name": "Tomato", "price": 4.50, "quantity": 35, "unit": "kg" },
        "potato": { "name": "Potato", "price": 3.25, "quantity": 80, "unit": "kg" }
      };
      await fs.writeFile(STOCK_FILE, JSON.stringify(initialStock, null, 2));
    }

    // Initialize bills file
    try {
      await fs.access(BILLS_FILE);
    } catch {
      await fs.writeFile(BILLS_FILE, JSON.stringify([], null, 2));
    }

    // Initialize item_db file
    try {
      await fs.access(ITEM_DB_FILE);
    } catch {
      await fs.writeFile(ITEM_DB_FILE, JSON.stringify({}, null, 2));
    }
  } catch (error) {
    console.error('Error initializing data files:', error);
  }
}

// Helper functions
async function readStock() {
  try {
    const data = await fs.readFile(STOCK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading stock:', error);
    return {};
  }
}

async function writeStock(stock) {
  try {
    await fs.writeFile(STOCK_FILE, JSON.stringify(stock, null, 2));
  } catch (error) {
    console.error('Error writing stock:', error);
  }
}

async function readBills() {
  try {
    const data = await fs.readFile(BILLS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bills:', error);
    return [];
  }
}

async function writeBills(bills) {
  try {
    await fs.writeFile(BILLS_FILE, JSON.stringify(bills, null, 2));
  } catch (error) {
    console.error('Error writing bills:', error);
  }
}

async function readItemDb() {
  try {
    const data = await fs.readFile(ITEM_DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading item db:', error);
    return {};
  }
}

async function writeItemDb(itemDb) {
  try {
    await fs.writeFile(ITEM_DB_FILE, JSON.stringify(itemDb, null, 2));
  } catch (error) {
    console.error('Error writing item db:', error);
  }
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioPath, language = 'en') {
  try {
    const fileStream = createReadStream(audioPath);
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
      language: language
    });
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

// Extract order from text using your implementation approach
async function extractOrderFromText(text) {
  try {
    const prompt = `
    Extract items and quantity from this order text:

    Text: "${text}"

    Return the response in this JSON format:
    [
      { "name": "item_name", "quantity": number },
      ...
    ]
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": "You are an assistant that extracts product orders from text." },
        { "role": "user", "content": prompt }
      ],
      temperature: 0
    });

    const resultText = response.choices[0].message.content;

    // Clean the response similar to your implementation
    const cleaned = resultText.replace(/```(json)?/g, "").trim().replace(/```/g, "");

    try {
      // Use JSON.parse instead of eval for security
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError);
      return {
        error: `Failed to parse GPT response: ${parseError.message}`,
        raw_response: resultText
      };
    }
  } catch (error) {
    console.error('Error extracting products:', error);
    return {
      error: `Failed to extract products: ${error.message}`,
      raw_response: ""
    };
  }
}

// Check availability function
async function checkAvailability(products) {
  const stock = await readStock();
  const availableItems = [];
  const unavailableItems = [];

  for (const product of products) {
    const productKey = product.name.toLowerCase();
    const stockItem = stock[productKey];

    if (stockItem && stockItem.quantity >= product.quantity) {
      availableItems.push({
        name: stockItem.name,
        quantity: product.quantity,
        unit: stockItem.unit,
        price: stockItem.price,
        total: stockItem.price * product.quantity
      });
    } else {
      unavailableItems.push({
        name: product.name,
        quantity: product.quantity,
        reason: stockItem ? 'Insufficient stock' : 'Product not found'
      });
    }
  }

  return { availableItems, unavailableItems };
}

// Save item to database
async function saveItemToDb(result) {
  const itemId = uuidv4();
  const itemDb = await readItemDb();

  itemDb[itemId] = {
    ...result,
    timestamp: new Date().toISOString()
  };

  await writeItemDb(itemDb);
  return itemId;
}

// Voice to text endpoint matching your implementation
app.post('/voice-to-text', upload.single('file'), async (req, res) => {
  try {
    const { lang = 'en' } = req.query;

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const tempFile = req.file.path;

    // Convert voice to text
    const transcribedText = await transcribeAudio(tempFile, lang);

    // Clean up the audio file
    await fs.unlink(tempFile);

    // Extract order from transcribed text
    const products = await extractOrderFromText(transcribedText);

    // Handle extraction errors
    if (products.error) {
      return res.status(500).json({
        error: products.error,
        text: transcribedText,
        raw_response: products.raw_response
      });
    }

    // Check stock
    const { availableItems, unavailableItems } = await checkAvailability(products);

    const result = {
      available_items: availableItems,
      unavailable_items: unavailableItems
    };

    const itemId = await saveItemToDb(result);

    return res.json({
      text: transcribedText,
      available_items: availableItems,
      unavailable_items: unavailableItems,
      item_id: itemId
    });

  } catch (error) {
    console.error('Error in voice-to-text:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Updated process-order endpoint to maintain compatibility
app.post('/api/process-order', upload.single('audio'), async (req, res) => {
  try {
    const { customerName, text, lang = 'en' } = req.body;
    let transcription = text;

    // If audio file is provided, transcribe it
    if (req.file) {
      transcription = await transcribeAudio(req.file.path, lang);
      // Clean up uploaded file
      await fs.unlink(req.file.path);
    }

    if (!transcription) {
      return res.status(400).json({ error: 'No audio or text provided' });
    }

    // Extract products from transcription using your implementation
    const extractedProducts = await extractOrderFromText(transcription);

    // Handle extraction errors
    if (extractedProducts.error) {
      return res.status(500).json({
        error: extractedProducts.error,
        transcription: transcription,
        raw_response: extractedProducts.raw_response
      });
    }

    // Check stock and generate bill
    const stock = await readStock();
    const billItems = [];
    const unavailableItems = [];
    let totalAmount = 0;

    for (const product of extractedProducts) {
      const productKey = product.name.toLowerCase();
      const stockItem = stock[productKey];

      if (stockItem && stockItem.quantity >= product.quantity) {
        const itemTotal = stockItem.price * product.quantity;
        billItems.push({
          name: stockItem.name,
          quantity: product.quantity,
          unit: stockItem.unit,
          price: stockItem.price,
          total: itemTotal
        });
        totalAmount += itemTotal;

        // Update stock
        stock[productKey].quantity -= product.quantity;
      } else {
        unavailableItems.push({
          name: product.name,
          quantity: product.quantity,
          reason: stockItem ? 'Insufficient stock' : 'Product not found'
        });
      }
    }

    // Save updated stock
    await writeStock(stock);

    // Generate bill
    const billId = uuidv4();
    const bill = {
      id: billId,
      customerName: customerName || 'Unknown Customer',
      transcription,
      extractedProducts,
      items: billItems,
      unavailableItems,
      totalAmount,
      createdAt: new Date().toISOString()
    };

    // Save bill
    const bills = await readBills();
    bills.push(bill);
    await writeBills(bills);

    res.json({
      success: true,
      billId,
      transcription,
      extractedProducts,
      bill
    });

  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Get home page data (matching your template approach)
app.get('/api/home-data', async (req, res) => {
  try {
    const itemDb = await readItemDb();

    if (Object.keys(itemDb).length === 0) {
      return res.json({ items: [] });
    }

    // Get the first key (assumes only 1 for simplicity, matching your approach)
    const key = Object.keys(itemDb)[0];
    const availableItems = itemDb[key].available_items || [];

    // Pass only name and quantity to match your template
    const simplifiedItems = availableItems.map(item => ({
      name: item.name,
      quantity: item.quantity
    }));

    res.json({ items: simplifiedItems });
  } catch (error) {
    console.error('Error fetching home data:', error);
    res.status(500).json({ error: 'Failed to fetch home data' });
  }
});

// Existing endpoints remain the same
app.get('/api/bills/:billId', async (req, res) => {
  try {
    const bills = await readBills();
    const bill = bills.find(b => b.id === req.params.billId);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

app.get('/api/bills', async (req, res) => {
  try {
    const bills = await readBills();
    const { customerName, limit = 50 } = req.query;

    let filteredBills = bills;

    if (customerName) {
      filteredBills = bills.filter(bill =>
        bill.customerName.toLowerCase().includes(customerName.toLowerCase())
      );
    }

    // Sort by creation date (newest first) and limit results
    filteredBills = filteredBills
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    res.json(filteredBills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

app.get('/api/stock', async (req, res) => {
  try {
    const stock = await readStock();
    res.json(stock);
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

app.put('/api/stock/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, price } = req.body;

    const stock = await readStock();

    if (!stock[productId]) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (quantity !== undefined) {
      stock[productId].quantity = Math.max(0, parseInt(quantity));
    }

    if (price !== undefined) {
      stock[productId].price = Math.max(0, parseFloat(price));
    }

    await writeStock(stock);
    res.json(stock[productId]);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const bills = await readBills();
    const stock = await readStock();

    const totalOrders = bills.length;
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalProducts = Object.keys(stock).length;
    const lowStockItems = Object.entries(stock)
      .filter(([_, item]) => item.quantity < 10)
      .length;

    const recentOrders = bills
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      totalOrders,
      totalRevenue,
      totalProducts,
      lowStockItems,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.put('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBill = req.body;
    const bills = await readBills();
    const index = bills.findIndex(b => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    bills[index] = { ...bills[index], ...updatedBill };
    await writeBills(bills);
    res.json(bills[index]);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

// Stock history tracking
let stockHistory = [];

// Add new endpoints for returns and expired stock
app.post('/api/stock/:productId/return', async (req, res) => {
  const { productId } = req.params;
  const { quantity, reason } = req.body;

  try {
    const product = stock[productId];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update stock quantity
    product.quantity += quantity;

    // Record in history
    stockHistory.push({
      id: Date.now().toString(),
      productId,
      productName: product.name,
      type: 'return',
      quantity,
      reason,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process return' });
  }
});

app.post('/api/stock/:productId/expire', async (req, res) => {
  const { productId } = req.params;
  const { quantity, reason } = req.body;

  try {
    const product = stock[productId];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Update stock quantity
    product.quantity -= quantity;

    // Record in history
    stockHistory.push({
      id: Date.now().toString(),
      productId,
      productName: product.name,
      type: 'expire',
      quantity,
      reason,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process expiration' });
  }
});

// Get stock history
app.get('/api/stock/history', (req, res) => {
  res.json(stockHistory);
});

// Simple in-memory user database
const users = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'user', password: 'user', role: 'user' },
];

// Signup endpoint
app.post('/api/signup', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  users.push({ username, password, role });
  res.json({ success: true });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ username: user.username, role: user.role });
});

// Get all customers with their payment history
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await readCustomers();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Add a new payment history entry for a customer
app.post('/api/customers/:customerId/payments', async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      date,
      bill_amount,
      cash_paid,
      online_paid,
      old_balance,
      bill_id // Expect bill_id to be sent from frontend
    } = req.body;

    // Calculate new balance
    const new_balance = Math.max(0, (bill_amount + old_balance) - (cash_paid + online_paid));

    const entry = {
      id: uuidv4(),
      date,
      bill_amount,
      cash_paid,
      online_paid,
      old_balance,
      new_balance
    };

    const customers = await readCustomers();
    const customerIndex = customers.findIndex(c => c.id === customerId);

    if (customerIndex === -1) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    customers[customerIndex].history.push(entry);
    await writeCustomers(customers);

    // Update the bill's payment status and remaining amount
    if (bill_id) {
      const bills = await readBills();
      const billIndex = bills.findIndex(b => b.id === bill_id);
      if (billIndex !== -1) {
        bills[billIndex].paymentStatus = new_balance === 0 ? 'paid' : 'not paid';
        bills[billIndex].remainingAmount = new_balance;
        await writeBills(bills);
      }
    }

    res.json(entry);
  } catch (error) {
    console.error('Error adding payment history:', error);
    res.status(500).json({ error: 'Failed to add payment history' });
  }
});

// Helper functions for customer data
async function readCustomers() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'data', 'customers.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading customers:', error);
    return [];
  }
}

async function writeCustomers(customers) {
  try {
    await fs.writeFile(
      path.join(__dirname, 'data', 'customers.json'),
      JSON.stringify(customers, null, 2)
    );
  } catch (error) {
    console.error('Error writing customers:', error);
  }
}

// Initialize customers file if it doesn't exist
async function initializeCustomersFile() {
  const customersFile = path.join(__dirname, 'data', 'customers.json');
  try {
    await fs.access(customersFile);
  } catch {
    await fs.writeFile(customersFile, JSON.stringify([], null, 2));
  }
}

// Get customer balance
app.get('/api/customers/:customerName/balance', async (req, res) => {
  try {
    const { customerName } = req.params;
    const customers = await readCustomers();
    const customer = customers.find(c => c.name === customerName);

    if (!customer) {
      return res.json({ balance: '0' });
    }

    res.json({ balance: customer.balance || '0' });
  } catch (error) {
    console.error('Error fetching customer balance:', error);
    res.status(500).json({ error: 'Failed to fetch customer balance' });
  }
});

// Update customer balance
app.put('/api/customers/:customerName/balance', async (req, res) => {
  try {
    const { customerName } = req.params;
    const { balance } = req.body;

    const customers = await readCustomers();
    let customer = customers.find(c => c.name === customerName);

    if (!customer) {
      // Create new customer if doesn't exist
      customer = {
        id: uuidv4(),
        name: customerName,
        balance: balance,
        history: []
      };
      customers.push(customer);
    } else {
      customer.balance = balance;
    }

    await writeCustomers(customers);
    res.json({ success: true, balance });
  } catch (error) {
    console.error('Error updating customer balance:', error);
    res.status(500).json({ error: 'Failed to update customer balance' });
  }
});

// Get all customer balances
app.get('/api/customers/balances', async (req, res) => {
  try {
    const customers = await readCustomers();
    const balances = customers.reduce((acc, customer) => {
      acc[customer.name] = customer.balance || '0';
      return acc;
    }, {});
    res.json(balances);
  } catch (error) {
    console.error('Error fetching customer balances:', error);
    res.status(500).json({ error: 'Failed to fetch customer balances' });
  }
});

// Initialize and start server
async function startServer() {
  await initializeDataFiles();
  await initializeCustomersFile();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- POST /voice-to-text (matches your implementation)');
    console.log('- POST /api/process-order (existing frontend compatibility)');
    console.log('- GET /api/home-data (matches your template approach)');
  });
}

startServer();



