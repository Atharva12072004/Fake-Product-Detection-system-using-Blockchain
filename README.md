# Fake-Product-Detection-system-using-Blockchain

A decentralized provenance & verification system to detect and prevent counterfeit products.
Manufacturer → Supplier → Retailer workflows are recorded on-chain (Sepolia testnet for development). Each product is registered with a unique serial number and a public QR code that links to its canonical on-chain record. A lightweight Node/Express backend serves metadata and files; a React frontend provides role-based UI and MetaMask wallet integration.

---

## Table of contents

* [Demo / Overview](#demo--overview)
* [Key features](#key-features)
* [Architecture](#architecture)
* [Repository structure](#repository-structure)
* [Prerequisites](#prerequisites)
* [Quick start — run locally](#quick-start--run-locally)

  * Backend
  * Frontend
  * Smart contract (Hardhat)
* [Environment variables (`.env` samples)](#environment-variables-env-samples)
* [API endpoints (backend)](#api-endpoints-backend)
* [Smart contract interface (concept)](#smart-contract-interface-concept)
* [How the product flow works](#how-the-product-flow-works)
* [Testing & debugging tips](#testing--debugging-tips)
* [Deployment Notes](#deployment-notes)
* [Contributing](#contributing)
* [License](#license)

---

## Demo / Overview

This project demonstrates a supply-chain provenance dApp where:

1. **Admin** manages user accounts (create manufacturer / supplier / retailer).
2. **Manufacturer** registers a product (name, img, description, location, date), signs a blockchain transaction via MetaMask and pays Sepolia test ETH. After successful registration a public **QR code** (contract address + serial) is generated and attached to the item.
3. **Supplier** scans the QR and updates shipment/receipt events on-chain.
4. **Retailer** scans QR to verify authenticity and set final state (sold/available).
5. **Anyone** scanning the QR can fetch the on-chain history.

---

## Key features

* Immutable on-chain event log for product lifecycle (create/update/transfer).
* Role-based access: admin / manufacturer / supplier / retailer.
* QR code generation (contract address + serial).
* Off-chain media (images) stored by backend; metadata anchored on-chain (hash/URI).
* MetaMask wallet-based signing & Sepolia gas for testing.
* Simple REST API backend for profile/product metadata.

---

## Architecture

```
[Frontend (React)] <---> [Backend (Express / Node)] <---> [Static uploads (public/uploads)]
      |
  MetaMask
      |
 [Sepolia Testnet Smart Contract - Hardhat/ethers]
```

* Frontend: React app with pages for roles, MetaMask connect, QR scanning/generation.
* Backend: Express server exposes endpoints for profiles, products and image uploads.
* Blockchain: Smart contract stores product registration events and provides read API for verification.

---

## Repository structure

```
/
├─ frontend/                 # React app (package.json, src/)
├─ backend/                  # Express server (server.js)
├─ contracts/                # Solidity contracts, Hardhat config
├─ scripts/                  # Hardhat deploy scripts
├─ README.md
└─ .gitignore
```

---

## Prerequisites

* Node.js (v16+ recommended) and npm/yarn
* MetaMask browser extension (connected to Sepolia testnet)
* Hardhat (for contract compilation & deployment)
* (Optional) IPFS or static hosting for large media

---

## Quick start — run locally

### 1) Backend (Express)

```bash
cd backend
npm install
# set env variables (see .env sample below)
node server.js
# or for dev with auto restart
# npm install -g nodemon
# nodemon server.js
```

Default backend runs at: `http://localhost:5000`

### 2) Frontend (React)

```bash
cd frontend
npm install
# copy .env.example -> .env and fill values
npm start
# opens http://localhost:3000
```

### 3) Smart contract (Hardhat) — compile & deploy to Sepolia

Inside project root:

```bash
cd contracts
npm install
npx hardhat compile

# deploy to Sepolia (you must configure .env with ALCHEMY/INFURA and DEPLOYER_PRIVATE_KEY)
npx hardhat run scripts/deploy.js --network sepolia
```

When deployment completes you'll get a `CONTRACT_ADDRESS`. Save it in frontend `.env` (CONTRACT\_ADDRESS) and backend config as needed.

> **Note:** For development you can also run Hardhat local network `npx hardhat node` and deploy to it.

---

## Environment variables (`.env` samples)

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CONTRACT_ADDRESS=0xYourDeployedContractAddress
REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here   # optional, for reverse geocoding
```

### Backend (`backend/.env`)

```env
PORT=5000
UPLOAD_DIR=public/uploads
```

### Hardhat / Deploy (`contracts/.env`)

```env
SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
DEPLOYER_PRIVATE_KEY=0xyourprivatekey
ETHERSCAN_API_KEY=your_etherscan_key   # optional for verify
```

**Security note:** Never commit private keys or secrets to Git. Use environment variables or secret storage.

---

## API endpoints (backend)

> Base: `http://localhost:5000`

* `GET /profile/:username` — fetch profile by username
* `POST /addprofile` — add profile (body: { username, name, description, website, location, image, role })
* `GET /product/:serialNumber` — fetch product by serial number
* `POST /addproduct` — add product (body: { serialNumber, name, brand })
* `POST /upload/product` — upload product image (multipart/form-data: `image`)
* `GET /file/product/:fileName` — serve uploaded product image

*(Adjust endpoint URLs if your implementation differs.)*

---

## Smart contract interface (concept)

A simple contract `ProductRegistry` might expose:

```solidity
struct Product {
  string serial;
  address manufacturer;
  string metadataURI; // off-chain pointer (IPFS / backend)
  uint256 timestamp;
  uint8 state; // e.g., 0=Created,1=WithSupplier,2=WithRetailer,3=Sold
}

mapping(string => Product) public products;

function registerProduct(string calldata serial, string calldata metadataURI) external payable;
function updateProductState(string calldata serial, uint8 newState) external payable;
function getProduct(string calldata serial) external view returns (Product memory);
```

* `registerProduct` called by Manufacturer (pays gas + optional fee).
* `updateProductState` called by Supplier/Retailer (signed, recorded).
* Keep on-chain storage minimal — use off-chain storage for images & large metadata, store hash/URI on-chain.

---

## How the product flow works

1. **Manufacturer** enters product details on the frontend. Frontend uploads image to backend (or IPFS), obtains metadata URI, calls `registerProduct(serial, metadataURI)` through MetaMask. After tx succeeds a QR code (`CONTRACT_ADDRESS,serial`) is generated and printed/attached.
2. **Supplier** scans QR → reads contract `getProduct(serial)`, verifies metadata/hash, and can call `updateProductState(serial, newState)` to record transfer (wallet-signed).
3. **Retailer** repeats scanning and state updates (e.g., mark as `Sold`).
4. **Consumer** scans QR and reads product history via `getProduct` + events (transparent verification).

---

## Testing & debugging tips

* Use Sepolia faucet to fund test wallets.
* Use `ethers.js` provider `Web3Provider(window.ethereum)` to ensure transactions originate from MetaMask signer.
* If MetaMask shows Mainnet popup while you use Sepolia, ensure contract & provider use the same network and you call `wallet_switchEthereumChain` if needed.
* Monitor hardhat/ethers logs when deploying.
* For reverse geocoding errors (Google), either add a valid `REACT_APP_GOOGLE_MAPS_API_KEY` or remove geocode steps during dev.

---

## Deployment Notes

* **Frontend**: host on Netlify / Vercel / GitHub Pages. Build with `npm run build` and upload `build/` directory. Make sure `REACT_APP_API_URL` points to your production backend.
* **Backend**: host on Render / Railway / Heroku / DigitalOcean. Ensure CORS allowed and file storage persists (or move to S3).
* **Contract**: deploy to Sepolia or your target network (Layer-2 recommended for production). Update `CONTRACT_ADDRESS` in frontend.

---

## Troubleshooting common issues

* **404 when fetching /profile/\:username** — confirm backend route is `GET /profile/:username` and that frontend uses same URL.
* **MetaMask transaction on wrong network** — check `window.ethereum.request({ method: 'eth_chainId' })` and call `wallet_switchEthereumChain` if mismatched.
* **CheckUnique returning 404** — ensure backend route for product lookup is `GET /product/:serialNumber` (not literal `/product/serialNumber`).
* **QR code shows wrong data** — the QR value should be `CONTRACT_ADDRESS,serialNumber`.

---

## Contributing

Contributions welcome. Typical workflow:

1. Fork the repo
2. Create a feature branch `git checkout -b feat/your-feature`
3. Commit changes & open a Pull Request
4. Ensure linters/tests pass before merging

Please open issues for bugs or feature requests.

---

## License

This project is released under the **MIT License** — see `LICENSE` for details.

---

## Acknowledgements

* Built with React, Express, Hardhat, ethers.js.
* Uses MetaMask for wallet interactions and Sepolia testnet for development testing.

---


Which of these should I add next?

