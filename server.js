// server.js (corrected)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 5000;

// Ensure upload directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const profileUploadPath = path.join(__dirname, 'public/uploads/profile');
const productUploadPath = path.join(__dirname, 'public/uploads/product');
ensureDir(profileUploadPath);
ensureDir(productUploadPath);

// Multer storages for profile and product separately
const storageProfile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profileUploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const storageProduct = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productUploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadProfile = multer({ storage: storageProfile });
const uploadProduct = multer({ storage: storageProduct });

// Mock data arrays
const authData = [
    { id: 1, username: 'admin', password: 'admin', role: 'admin' },
    { id: 2, username: 'supp', password: 'supp', role: 'supplier' },
    { id: 3, username: 'manu', password: 'manu', role: 'manufacturer' },
    { id: 4, username: 'retailer', password: 'retailer', role: 'retailer' }
];

const profileData = [
    { id: 1, username: 'admin', name: 'Admin User', description: 'System Administrator', website: 'admin.com', location: 'Admin City', image: 'admin.jpeg', role: 'admin' },
    { id: 2, username: 'supp', name: 'Supplier User', description: 'Product Supplier', website: 'supplier.com', location: 'Supplier City', image: 'supp.jpeg', role: 'supplier' },
    { id: 3, username: 'manu', name: 'Manufacturer User', description: 'Product Manufacturer', website: 'manufacturer.com', location: 'Manufacturer City', image: 'manu.jpeg', role: 'manufacturer' },
    { id: 4, username: 'retailer', name: 'Retailer User', description: 'Product Retailer', website: 'retailer.com', location: 'Retailer City', image: 'retailer.jpeg', role: 'retailer' }
];

const productData = [
    { id: 1, serialNumber: 'CH001', name: 'Chanel Classic Handbag', brand: 'Chanel', image: 'Chanel_ClassicHandbag_Black.png' },
    { id: 2, serialNumber: 'CH002', name: 'Chanel Flap Bag', brand: 'Chanel', image: 'Chanel_FlapBag_Black.png' },
    { id: 3, serialNumber: 'CH003', name: 'Chanel Mini Flapbag', brand: 'Chanel', image: 'Chanel_MiniFlapbag_TopHandle.png' },
    { id: 4, serialNumber: 'CH004', name: 'Chanel Small Flap Bag', brand: 'Chanel', image: 'Chanel_SmallFlapBag_White.png' }
];

// Auth endpoints
app.get('/authAll', (req, res) => {
    res.header('Access-Control-Allow-Credentials', true);
    res.send(authData);
    console.log("Auth data sent successfully");
});

// If you prefer POST for auth check, you can keep this; it's fine.
// (Your frontend may use POST or GET for login; adapt accordingly.)
app.post('/auth/:username/:password', (req, res) => {
    const { username, password } = req.params;
    const user = authData.find(u => u.username === username && u.password === password);
    res.send(user ? [user] : []);
    console.log("Auth check completed");
});

app.post('/addaccount', (req, res) => {
    const { username, password, role } = req.body;
    const newId = authData.length ? Math.max(...authData.map(item => item.id)) + 1 : 1;
    authData.push({ id: newId, username, password, role });
    res.send('Data inserted');
    console.log('Account added successfully');
});

// Profile endpoints
app.get('/profileAll', (req, res) => {
    res.send(profileData);
    console.log("Profile data sent successfully");
});

// ===== CHANGED to GET so frontend axios.get('/profile/:username') works =====
app.get('/profile/:username', (req, res) => {
    const { username } = req.params;
    const profile = profileData.find(p => p.username === username);
    res.send(profile ? [profile] : []);
    console.log("Profile lookup for", username, "->", profile ? "found" : "not found");
});

app.post('/addprofile', (req, res) => {
    const { username, name, description, website, location, image, role } = req.body;
    const newId = profileData.length ? Math.max(...profileData.map(item => item.id)) + 1 : 1;
    profileData.push({ id: newId, username, name, description, website, location, image, role });
    res.send('Profile inserted');
    console.log('Profile added successfully');
});

// Product endpoints
app.get('/productAll', (req, res) => {
    res.send(productData);
    console.log("Product data sent successfully");
});

// ===== CHANGED to GET so frontend axios.get('/product/:serialNumber') works =====
app.get('/product/:serialNumber', (req, res) => {
    const { serialNumber } = req.params;
    const product = productData.find(p => p.serialNumber === serialNumber);
    res.send(product ? [product] : []);
    console.log("Product lookup for", serialNumber, "->", product ? "found" : "not found");
});

app.post('/addproduct', (req, res) => {
    let body = req.body;
    // If frontend sends a stringified JSON, parse it
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
    }

    const { serialNumber, name, brand } = body;
    const newId = productData.length ? Math.max(...productData.map(item => item.id)) + 1 : 1;
    productData.push({ id: newId, serialNumber, name, brand });
    res.send('Data inserted');
    console.log('Product added successfully');
});

// File upload endpoints
app.post('/upload/profile', uploadProfile.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    
    const imagePath = `/uploads/profile/${req.file.filename}`;
    res.json({ 
        success: true, 
        imagePath: imagePath,
        filename: req.file.filename 
    });
    console.log('Profile image uploaded successfully:', req.file.filename);
});

app.post('/upload/product', uploadProduct.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    
    const imagePath = `/uploads/product/${req.file.filename}`;
    res.json({ 
        success: true, 
        imagePath: imagePath,
        filename: req.file.filename 
    });
    console.log('Product image uploaded successfully:', req.file.filename);
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.listen(port, () => {
    console.log('Server is running on port', port);
});
