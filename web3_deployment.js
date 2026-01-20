// ============================================
// DEPLOYMENT SCRIPT - deploy.js
// ============================================
// Pastikan sudah install: npm install web3 @truffle/hdwallet-provider

const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Konfigurasi koneksi ke jaringan Sepolia
const INFURA_PROJECT_ID = 'YOUR_INFURA_PROJECT_ID'; // Ganti dengan Project ID Infura Anda
const SEPOLIA_URL = `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`;
const PRIVATE_KEY = 'YOUR_PRIVATE_KEY'; // Ganti dengan private key MetaMask Anda (JANGAN SHARE!)

// ABI dan Bytecode dari kompilasi smart contract
// (Anda perlu compile dulu dengan Remix atau Hardhat untuk mendapatkan ini)
const CONTRACT_ABI = [
  // Paste ABI dari hasil kompilasi di sini
  // Contoh minimal untuk demonstrasi:
  {
    "inputs": [
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "string", "name": "_licensePlate", "type": "string"},
      {"internalType": "string", "name": "_vehicleType", "type": "string"},
      {"internalType": "uint256", "name": "_fareRate", "type": "uint256"}
    ],
    "name": "registerDriver",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_pickupLocation", "type": "string"},
      {"internalType": "string", "name": "_destination", "type": "string"},
      {"internalType": "uint256", "name": "_estimatedDistance", "type": "uint256"},
      {"internalType": "uint256", "name": "_agreedFare", "type": "uint256"},
      {"internalType": "string", "name": "_notes", "type": "string"}
    ],
    "name": "requestRide",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_rideId", "type": "uint256"}],
    "name": "acceptRide",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_rideId", "type": "uint256"}],
    "name": "fundRide",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_rideId", "type": "uint256"}],
    "name": "completeRide",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_rideId", "type": "uint256"}],
    "name": "confirmArrival",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_driverAddress", "type": "address"}],
    "name": "getDriver",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "walletAddress", "type": "address"},
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "string", "name": "licensePlate", "type": "string"},
          {"internalType": "string", "name": "vehicleType", "type": "string"},
          {"internalType": "uint256", "name": "fareRate", "type": "uint256"},
          {"internalType": "bool", "name": "isRegistered", "type": "bool"}
        ],
        "internalType": "struct RideSharing.Driver",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_rideId", "type": "uint256"}],
    "name": "getRide",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "rideId", "type": "uint256"},
          {"internalType": "address", "name": "passenger", "type": "address"},
          {"internalType": "address", "name": "driver", "type": "address"},
          {"internalType": "string", "name": "pickupLocation", "type": "string"},
          {"internalType": "string", "name": "destination", "type": "string"},
          {"internalType": "uint256", "name": "estimatedDistance", "type": "uint256"},
          {"internalType": "uint256", "name": "agreedFare", "type": "uint256"},
          {"internalType": "string", "name": "notes", "type": "string"},
          {"internalType": "enum RideSharing.RideStatus", "name": "status", "type": "uint8"},
          {"internalType": "uint256", "name": "escrowAmount", "type": "uint256"}
        ],
        "internalType": "struct RideSharing.Ride",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_BYTECODE = 'YOUR_CONTRACT_BYTECODE'; // Paste bytecode dari hasil kompilasi

async function deployContract() {
  console.log('🚀 Memulai deployment ke Sepolia testnet...\n');
  
  // Setup provider dengan HDWalletProvider
  const provider = new HDWalletProvider(PRIVATE_KEY, SEPOLIA_URL);
  const web3 = new Web3(provider);
  
  try {
    // Dapatkan akun yang akan digunakan untuk deploy
    const accounts = await web3.eth.getAccounts();
    console.log(`📍 Deploying dari akun: ${accounts[0]}`);
    
    // Cek balance
    const balance = await web3.eth.getBalance(accounts[0]);
    console.log(`💰 Balance: ${web3.utils.fromWei(balance, 'ether')} ETH\n`);
    
    // Deploy contract
    console.log('⏳ Deploying contract...');
    const contract = new web3.eth.Contract(CONTRACT_ABI);
    
    const deployTx = contract.deploy({
      data: CONTRACT_BYTECODE
    });
    
    const deployedContract = await deployTx.send({
      from: accounts[0],
      gas: 5000000,
      gasPrice: web3.utils.toWei('10', 'gwei')
    });
    
    console.log('✅ Contract berhasil di-deploy!');
    console.log(`📝 Contract Address: ${deployedContract.options.address}\n`);
    console.log('🔗 Lihat di Sepolia Etherscan:');
    console.log(`https://sepolia.etherscan.io/address/${deployedContract.options.address}\n`);
    
    // Simpan contract address untuk digunakan nanti
    return deployedContract.options.address;
    
  } catch (error) {
    console.error('❌ Error saat deployment:', error);
  } finally {
    provider.engine.stop();
  }
}

// Jalankan deployment
deployContract();


// ============================================
// TESTING SCRIPT - test.js
// ============================================

const Web3 = require('web3');

// Konfigurasi
const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS'; // Ganti dengan address hasil deploy
const web3 = new Web3('https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID');

// Atau untuk local testing, gunakan MetaMask
// const web3 = new Web3(window.ethereum);

const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

/**
 * Fungsi Testing - A. Registrasi Pengemudi
 */
async function testRegisterDriver() {
  console.log('\n=== TEST: Registrasi Pengemudi ===');
  
  const accounts = await web3.eth.getAccounts();
  const driverAccount = accounts[0];
  
  try {
    // Registrasi pengemudi
    const receipt = await contract.methods.registerDriver(
      'Budi Santoso',          // Nama
      'B 1234 XYZ',            // Plat nomor
      'Toyota Avanza',         // Tipe kendaraan
      web3.utils.toWei('0.001', 'ether') // Tarif per km (0.001 ETH)
    ).send({
      from: driverAccount,
      gas: 300000
    });
    
    console.log('✅ Pengemudi berhasil terdaftar!');
    console.log(`Transaction Hash: ${receipt.transactionHash}`);
    
    // Ambil data pengemudi untuk verifikasi
    const driver = await contract.methods.getDriver(driverAccount).call();
    console.log('\n📋 Data Pengemudi:');
    console.log(`   Nama: ${driver.name}`);
    console.log(`   Plat: ${driver.licensePlate}`);
    console.log(`   Kendaraan: ${driver.vehicleType}`);
    console.log(`   Tarif: ${web3.utils.fromWei(driver.fareRate, 'ether')} ETH/km`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Fungsi Testing - B. Pemesanan Perjalanan
 */
async function testRequestRide() {
  console.log('\n=== TEST: Pemesanan Perjalanan ===');
  
  const accounts = await web3.eth.getAccounts();
  const passengerAccount = accounts[1]; // Gunakan akun berbeda untuk penumpang
  
  try {
    const receipt = await contract.methods.requestRide(
      'Jl. Sudirman No. 123',  // Lokasi penjemputan
      'Bandara Soekarno-Hatta', // Tujuan
      15000,                    // Jarak estimasi (15 km dalam meter)
      web3.utils.toWei('0.015', 'ether'), // Harga (15km x 0.001 ETH)
      'Mohon datang tepat waktu' // Catatan
    ).send({
      from: passengerAccount,
      gas: 300000
    });
    
    console.log('✅ Pesanan berhasil dibuat!');
    console.log(`Transaction Hash: ${receipt.transactionHash}`);
    
    // Ambil data pesanan (ride ID = 1)
    const ride = await contract.methods.getRide(1).call();
    console.log('\n📋 Detail Pesanan:');
    console.log(`   Ride ID: ${ride.rideId}`);
    console.log(`   Penumpang: ${ride.passenger}`);
    console.log(`   Pickup: ${ride.pickupLocation}`);
    console.log(`   Tujuan: ${ride.destination}`);
    console.log(`   Jarak: ${ride.estimatedDistance} meter`);
    console.log(`   Harga: ${web3.utils.fromWei(ride.agreedFare, 'ether')} ETH`);
    console.log(`   Status: ${getRideStatusName(ride.status)}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Fungsi Testing - C. Penerimaan dan Penyelesaian Perjalanan
 */
async function testCompleteRideFlow() {
  console.log('\n=== TEST: Alur Lengkap Perjalanan dengan Escrow ===');
  
  const accounts = await web3.eth.getAccounts();
  const driverAccount = accounts[0];
  const passengerAccount = accounts[1];
  const rideId = 1;
  
  try {
    // 1. Pengemudi menerima pesanan
    console.log('\n1️⃣ Pengemudi menerima pesanan...');
    await contract.methods.acceptRide(rideId).send({
      from: driverAccount,
      gas: 200000
    });
    console.log('✅ Pesanan diterima! Status: ACCEPTED');
    
    // 2. Penumpang membayar ke escrow
    console.log('\n2️⃣ Penumpang membayar ke escrow...');
    const fareAmount = web3.utils.toWei('0.015', 'ether');
    await contract.methods.fundRide(rideId).send({
      from: passengerAccount,
      value: fareAmount,
      gas: 200000
    });
    console.log('✅ Pembayaran berhasil! Status: FUNDED');
    console.log(`   Dana escrow: ${web3.utils.fromWei(fareAmount, 'ether')} ETH`);
    
    // 3. Pengemudi menyelesaikan perjalanan
    console.log('\n3️⃣ Pengemudi menyelesaikan perjalanan...');
    await contract.methods.completeRide(rideId).send({
      from: driverAccount,
      gas: 200000
    });
    console.log('✅ Perjalanan selesai! Status: COMPLETED_BY_DRIVER');
    
    // 4. Penumpang konfirmasi dan dana dibayarkan
    console.log('\n4️⃣ Penumpang konfirmasi kedatangan...');
    const driverBalanceBefore = await web3.eth.getBalance(driverAccount);
    
    await contract.methods.confirmArrival(rideId).send({
      from: passengerAccount,
      gas: 200000
    });
    
    const driverBalanceAfter = await web3.eth.getBalance(driverAccount);
    const payment = BigInt(driverBalanceAfter) - BigInt(driverBalanceBefore);
    
    console.log('✅ Perjalanan finalisasi! Status: FINALIZED');
    console.log(`   Dana dibayarkan ke pengemudi: ${web3.utils.fromWei(payment.toString(), 'ether')} ETH`);
    
    // Tampilkan status akhir
    const finalRide = await contract.methods.getRide(rideId).call();
    console.log('\n📊 Status Akhir:');
    console.log(`   Ride ID: ${finalRide.rideId}`);
    console.log(`   Status: ${getRideStatusName(finalRide.status)}`);
    console.log(`   Escrow Amount: ${finalRide.escrowAmount} (should be 0)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Helper function untuk mendapatkan nama status
 */
function getRideStatusName(status) {
  const statusNames = [
    'Requested',
    'Accepted',
    'Funded',
    'CompletedByDriver',
    'Finalized',
    'Cancelled'
  ];
  return statusNames[status] || 'Unknown';
}

/**
 * Jalankan semua test
 */
async function runAllTests() {
  console.log('🧪 Memulai Testing Smart Contract Ride-Sharing\n');
  console.log('='.repeat(50));
  
  await testRegisterDriver();
  await testRequestRide();
  await testCompleteRideFlow();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Semua test selesai!\n');
}

// Uncomment untuk menjalankan
// runAllTests();


// ============================================
// FRONTEND INTEGRATION EXAMPLE - app.js
// ============================================

/**
 * Contoh integrasi dengan frontend menggunakan MetaMask
 */

class RideSharingApp {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
  }
  
  /**
   * Koneksi ke MetaMask
   */
  async connect() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request akses akun
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        this.account = accounts[0];
        this.web3 = new Web3(window.ethereum);
        this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        console.log('✅ Terhubung ke MetaMask');
        console.log(`Akun aktif: ${this.account}`);
        
        // Tampilkan alamat akun dan nama jaringan
        const network = await this.web3.eth.net.getNetworkType();
        console.log(`Jaringan: ${network}`);
        
        return true;
      } catch (error) {
        console.error('❌ Koneksi gagal:', error);
        return false;
      }
    } else {
      alert('MetaMask tidak terdeteksi! Silakan install MetaMask.');
      return false;
    }
  }
  
  /**
   * Registrasi pengemudi
   */
  async registerDriver(name, licensePlate, vehicleType, fareRate) {
    try {
      const fareInWei = this.web3.utils.toWei(fareRate.toString(), 'ether');
      
      const receipt = await this.contract.methods.registerDriver(
        name,
        licensePlate,
        vehicleType,
        fareInWei
      ).send({ from: this.account });
      
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Request ride
   */
  async requestRide(pickup, destination, distance, fare, notes) {
    try {
      const fareInWei = this.web3.utils.toWei(fare.toString(), 'ether');
      
      const receipt = await this.contract.methods.requestRide(
        pickup,
        destination,
        distance,
        fareInWei,
        notes || ''
      ).send({ from: this.account });
      
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Accept ride
   */
  async acceptRide(rideId) {
    try {
      const receipt = await this.contract.methods.acceptRide(rideId)
        .send({ from: this.account });
      
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Fund ride (escrow payment)
   */
  async fundRide(rideId, amount) {
    try {
      const amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
      
      const receipt = await this.contract.methods.fundRide(rideId)
        .send({
          from: this.account,
          value: amountInWei
        });
      
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Complete ride
   */
  async completeRide(rideId) {
    try {
      const receipt = await this.contract.methods.completeRide(rideId)
        .send({ from: this.account });
      
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Confirm arrival
   */
  async confirmArrival(rideId) {
    try {
      const receipt = await this.contract.methods.confirmArrival(rideId)
        .send({ from: this.account });
      
      return { success: true, txHash: receipt.transactionHash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get ride details
   */
  async getRide(rideId) {
    try {
      const ride = await this.contract.methods.getRide(rideId).call();
      return {
        success: true,
        data: {
          rideId: ride.rideId,
          passenger: ride.passenger,
          driver: ride.driver,
          pickupLocation: ride.pickupLocation,
          destination: ride.destination,
          estimatedDistance: ride.estimatedDistance,
          agreedFare: this.web3.utils.fromWei(ride.agreedFare, 'ether'),
          notes: ride.notes,
          status: this.getStatusName(ride.status),
          escrowAmount: this.web3.utils.fromWei(ride.escrowAmount, 'ether')
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  getStatusName(status) {
    const statusNames = ['Requested', 'Accepted', 'Funded', 'CompletedByDriver', 'Finalized', 'Cancelled'];
    return statusNames[status] || 'Unknown';
  }
}

// Contoh penggunaan
// const app = new RideSharingApp();
// await app.connect();
// await app.registerDriver('John Doe', 'B 1234 AB', 'Toyota Avanza', '0.001');