// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title RideSharing
 * @dev Smart contract untuk sistem ride-sharing dengan mekanisme escrow
 */
contract RideSharing {
    
    // Struktur data untuk Pengemudi
    struct Driver {
        address walletAddress;
        string name;
        string licensePlate;
        string vehicleType;
        uint256 fareRate; // Tarif per km dalam wei
        bool isRegistered;
    }
    
    // Enum untuk status pesanan
    enum RideStatus {
        Requested,
        Accepted,
        Funded,
        CompletedByDriver,
        Finalized,
        Cancelled
    }
    
    // Struktur data untuk Pesanan Perjalanan
    struct Ride {
        uint256 rideId;
        address passenger;
        address driver;
        string pickupLocation;
        string destination;
        uint256 estimatedDistance; // dalam meter
        uint256 agreedFare; // harga yang disepakati dalam wei
        string notes;
        RideStatus status;
        uint256 escrowAmount; // dana yang ditahan
    }
    
    // Mapping untuk menyimpan data pengemudi berdasarkan alamat wallet
    mapping(address => Driver) public drivers;
    
    // Mapping untuk menyimpan pesanan berdasarkan ID
    mapping(uint256 => Ride) public rides;
    
    // Counter untuk ID pesanan
    uint256 public rideCounter;
    
    // Events untuk logging
    event DriverRegistered(address indexed driverAddress, string name, string licensePlate);
    event RideRequested(uint256 indexed rideId, address indexed passenger, string pickup, string destination);
    event RideAccepted(uint256 indexed rideId, address indexed driver);
    event RideFunded(uint256 indexed rideId, uint256 amount);
    event RideStarted(uint256 indexed rideId);
    event RideCompletedByDriver(uint256 indexed rideId);
    event RideFinalized(uint256 indexed rideId, address indexed driver, uint256 payment);
    event RideCancelled(uint256 indexed rideId);
    
    // Modifier untuk memastikan hanya pengemudi yang terdaftar
    modifier onlyRegisteredDriver() {
        require(drivers[msg.sender].isRegistered, "Anda belum terdaftar sebagai pengemudi");
        _;
    }
    
    /**
     * A. FUNGSI DATA PENGEMUDI
     */
    
    /**
     * @dev Fungsi untuk mendaftarkan pengemudi baru
     * @param _name Nama pengemudi
     * @param _licensePlate Plat nomor kendaraan
     * @param _vehicleType Tipe kendaraan
     * @param _fareRate Tarif per km dalam wei
     */
    function registerDriver(
        string memory _name,
        string memory _licensePlate,
        string memory _vehicleType,
        uint256 _fareRate
    ) public {
        // Validasi: pengemudi tidak boleh mendaftar lebih dari satu kali
        require(!drivers[msg.sender].isRegistered, "Pengemudi sudah terdaftar");
        require(bytes(_name).length > 0, "Nama tidak boleh kosong");
        require(bytes(_licensePlate).length > 0, "Plat nomor tidak boleh kosong");
        require(_fareRate > 0, "Tarif harus lebih dari 0");
        
        // Simpan data pengemudi ke blockchain
        drivers[msg.sender] = Driver({
            walletAddress: msg.sender,
            name: _name,
            licensePlate: _licensePlate,
            vehicleType: _vehicleType,
            fareRate: _fareRate,
            isRegistered: true
        });
        
        emit DriverRegistered(msg.sender, _name, _licensePlate);
    }
    
    /**
     * @dev Fungsi untuk melihat data pengemudi berdasarkan alamat wallet
     * @param _driverAddress Alamat wallet pengemudi
     * @return Driver struct yang berisi semua data pengemudi
     */
    function getDriver(address _driverAddress) public view returns (Driver memory) {
        require(drivers[_driverAddress].isRegistered, "Pengemudi tidak ditemukan");
        return drivers[_driverAddress];
    }
    
    /**
     * B. FUNGSI PEMESANAN PERJALANAN
     */
    
    /**
     * @dev Fungsi untuk membuat pesanan perjalanan oleh penumpang
     * @param _pickupLocation Lokasi penjemputan
     * @param _destination Lokasi tujuan
     * @param _estimatedDistance Jarak estimasi dalam meter
     * @param _agreedFare Harga yang disepakati dalam wei
     * @param _notes Catatan tambahan (opsional)
     */
    function requestRide(
        string memory _pickupLocation,
        string memory _destination,
        uint256 _estimatedDistance,
        uint256 _agreedFare,
        string memory _notes
    ) public {
        require(bytes(_pickupLocation).length > 0, "Lokasi penjemputan tidak boleh kosong");
        require(bytes(_destination).length > 0, "Tujuan tidak boleh kosong");
        require(_agreedFare > 0, "Harga harus lebih dari 0");
        
        // Increment counter dan buat pesanan baru
        rideCounter++;
        
        rides[rideCounter] = Ride({
            rideId: rideCounter,
            passenger: msg.sender,
            driver: address(0), // Belum ada pengemudi
            pickupLocation: _pickupLocation,
            destination: _destination,
            estimatedDistance: _estimatedDistance,
            agreedFare: _agreedFare,
            notes: _notes,
            status: RideStatus.Requested,
            escrowAmount: 0
        });
        
        emit RideRequested(rideCounter, msg.sender, _pickupLocation, _destination);
    }
    
    /**
     * C. FUNGSI PENERIMAAN DAN PENYELESAIAN PERJALANAN
     */
    
    /**
     * @dev Fungsi untuk menerima pesanan oleh pengemudi
     * @param _rideId ID pesanan yang akan diterima
     */
    function acceptRide(uint256 _rideId) public onlyRegisteredDriver {
        Ride storage ride = rides[_rideId];
        
        require(ride.passenger != address(0), "Pesanan tidak ditemukan");
        require(ride.status == RideStatus.Requested, "Pesanan tidak dalam status Requested");
        require(ride.driver == address(0), "Pesanan sudah diterima pengemudi lain");
        
        // Set pengemudi dan ubah status
        ride.driver = msg.sender;
        ride.status = RideStatus.Accepted;
        
        emit RideAccepted(_rideId, msg.sender);
    }
    
    /**
     * @dev Fungsi untuk membayar biaya perjalanan ke smart contract (escrow)
     * @param _rideId ID pesanan
     */
    function fundRide(uint256 _rideId) public payable {
        Ride storage ride = rides[_rideId];
        
        require(msg.sender == ride.passenger, "Hanya penumpang yang dapat membayar");
        require(ride.status == RideStatus.Accepted, "Pesanan harus dalam status Accepted");
        require(msg.value >= ride.agreedFare, "Jumlah pembayaran tidak mencukupi");
        
        // Simpan dana ke escrow
        ride.escrowAmount = msg.value;
        ride.status = RideStatus.Funded;
        
        emit RideFunded(_rideId, msg.value);
    }
    
    /**
     * @dev Fungsi untuk menyatakan perjalanan selesai oleh pengemudi
     * @param _rideId ID pesanan
     */
    function completeRide(uint256 _rideId) public onlyRegisteredDriver {
        Ride storage ride = rides[_rideId];
        
        require(msg.sender == ride.driver, "Hanya pengemudi yang menerima pesanan ini");
        require(ride.status == RideStatus.Funded, "Pesanan harus dalam status Funded");
        
        // Ubah status menjadi CompletedByDriver
        ride.status = RideStatus.CompletedByDriver;
        
        emit RideCompletedByDriver(_rideId);
    }
    
    /**
     * @dev Fungsi untuk konfirmasi selesai oleh penumpang dan transfer dana ke pengemudi
     * @param _rideId ID pesanan
     */
    function confirmArrival(uint256 _rideId) public {
        Ride storage ride = rides[_rideId];
        
        require(msg.sender == ride.passenger, "Hanya penumpang yang dapat konfirmasi");
        require(ride.status == RideStatus.CompletedByDriver, "Perjalanan belum selesai oleh pengemudi");
        require(ride.escrowAmount > 0, "Tidak ada dana di escrow");
        
        // Transfer dana ke pengemudi
        uint256 payment = ride.escrowAmount;
        ride.escrowAmount = 0;
        ride.status = RideStatus.Finalized;
        
        // Transfer payment ke pengemudi
        payable(ride.driver).transfer(payment);
        
        emit RideFinalized(_rideId, ride.driver, payment);
    }
    
    /**
     * D. FUNGSI TAMBAHAN
     */
    
    /**
     * @dev Fungsi untuk membatalkan pesanan (hanya jika belum Funded)
     * @param _rideId ID pesanan
     */
    function cancelRide(uint256 _rideId) public {
        Ride storage ride = rides[_rideId];
        
        require(msg.sender == ride.passenger, "Hanya penumpang yang dapat membatalkan");
        require(
            ride.status == RideStatus.Requested || ride.status == RideStatus.Accepted,
            "Pesanan tidak dapat dibatalkan"
        );
        
        ride.status = RideStatus.Cancelled;
        
        emit RideCancelled(_rideId);
    }
    
    /**
     * @dev Fungsi untuk mendapatkan detail pesanan
     * @param _rideId ID pesanan
     * @return Ride struct yang berisi semua data pesanan
     */
    function getRide(uint256 _rideId) public view returns (Ride memory) {
        require(rides[_rideId].passenger != address(0), "Pesanan tidak ditemukan");
        return rides[_rideId];
    }
    
    /**
     * @dev Fungsi untuk mendapatkan status pesanan
     * @param _rideId ID pesanan
     * @return Status pesanan dalam bentuk enum
     */
    function getRideStatus(uint256 _rideId) public view returns (RideStatus) {
        require(rides[_rideId].passenger != address(0), "Pesanan tidak ditemukan");
        return rides[_rideId].status;
    }
}