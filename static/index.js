// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const navLinks = document.querySelectorAll('.nav a');
    const contentSections = document.querySelectorAll('.content');
    
    // Reservation Modal
    const newReservationBtn = document.getElementById('new-reservation-btn');
    const reservationModal = document.getElementById('reservation-modal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-reservation');
    const reservationForm = document.getElementById('reservation-form');
    
    // Dashboard Chart
    const availabilityChartContainer = document.getElementById('availability-chart');
    
    // Sample data for room types
    const roomTypes = [
        { type: 'Standard', available: 15, occupied: 5, total: 20 },
        { type: 'Deluxe', available: 8, occupied: 12, total: 20 },
        { type: 'Suite', available: 4, occupied: 6, total: 10 },
        { type: 'Executive', available: 2, occupied: 3, total: 5 }
    ];
    
    // Sample reservation data
    const reservations = [
        { 
            id: 'RES-001',
            guestName: 'John Smith',
            roomType: 'Deluxe',
            checkIn: '2025-03-19',
            checkOut: '2025-03-22',
            total: '$450',
            status: 'confirmed'
        },
        { 
            id: 'RES-002',
            guestName: 'Sarah Johnson',
            roomType: 'Suite',
            checkIn: '2025-03-18',
            checkOut: '2025-03-25',
            total: '$1,200',
            status: 'in-house'
        },
        { 
            id: 'RES-003',
            guestName: 'Michael Brown',
            roomType: 'Standard',
            checkIn: '2025-03-15',
            checkOut: '2025-03-19',
            total: '$320',
            status: 'checked-out'
        },
        { 
            id: 'RES-004',
            guestName: 'Emily Wilson',
            roomType: 'Executive',
            checkIn: '2025-03-22',
            checkOut: '2025-03-26',
            total: '$780',
            status: 'confirmed'
        },
        { 
            id: 'RES-005',
            guestName: 'Robert Davis',
            roomType: 'Standard',
            checkIn: '2025-03-20',
            checkOut: '2025-03-23',
            total: '$240',
            status: 'confirmed'
        }
    ];
    
    // Initialize the app
    function init() {
        setupNavigation();
        renderAvailabilityChart();
        setupReservationModal();
        populateReservationsTable();
        setupDateValidation();
    }
    
    // Navigation setup
    function setupNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all links and content sections
                navLinks.forEach(link => link.parentElement.classList.remove('active'));
                contentSections.forEach(section => section.classList.remove('active'));
                
                // Add active class to clicked link
                this.parentElement.classList.add('active');
                
                // Show corresponding content section
                const targetId = this.getAttribute('href').substring(1);
                document.getElementById(targetId).classList.add('active');
            });
        });
    }
    
    // Render availability chart
    function renderAvailabilityChart() {
        if (!availabilityChartContainer) return;
        
        // Create chart HTML
        let chartHTML = '<div class="room-availability-chart">';
        
        roomTypes.forEach(room => {
            const occupancyPercentage = (room.occupied / room.total) * 100;
            
            chartHTML += `
                <div class="room-type">
                    <div class="room-label">
                        <span class="type-name">${room.type}</span>
                        <span class="type-count">${room.available} / ${room.total} available</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${occupancyPercentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        chartHTML += '</div>';
        
        // Add chart styles
        const chartStyles = `
            <style>
                .room-availability-chart {
                    margin-top: 20px;
                }
                .room-type {
                    margin-bottom: 15px;
                }
                .room-label {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                .type-name {
                    font-weight: 500;
                }
                .type-count {
                    color: #6c757d;
                }
                .progress-bar {
                    height: 8px;
                    background-color: #e9ecef;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress {
                    height: 100%;
                    background-color: var(--primary-color);
                }
            </style>
        `;
        
        // Add chart to container
        availabilityChartContainer.innerHTML = chartStyles + chartHTML;
    }
    
    // Setup reservation modal
    function setupReservationModal() {
        if (!newReservationBtn || !reservationModal) return;
        
        // Open modal
        newReservationBtn.addEventListener('click', function() {
            reservationModal.style.display = 'block';
        });
        
        // Close modal
        closeBtn.addEventListener('click', function() {
            reservationModal.style.display = 'none';
        });
        
        cancelBtn.addEventListener('click', function() {
            reservationModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === reservationModal) {
                reservationModal.style.display = 'none';
            }
        });
        
        // Handle form submission
        reservationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(reservationForm);
            const reservationData = {
                guestName: formData.get('guest-name'),
                email: formData.get('guest-email'),
                phone: formData.get('guest-phone'),
                guests: formData.get('num-guests'),
                checkIn: formData.get('check-in-date'),
                checkOut: formData.get('check-out-date'),
                roomType: formData.get('room-type'),
                roomPreference: formData.get('room-preference'),
                specialRequests: formData.get('special-requests')
            };
            
            // Here you would typically send this data to the backend
            console.log('Reservation data:', reservationData);
            
            // For demo purposes, add to the table
            const newReservation = {
                id: `RES-${Math.floor(Math.random() * 1000)}`,
                guestName: reservationData.guestName,
                roomType: capitalizeFirstLetter(reservationData.roomType),
                checkIn: reservationData.checkIn,
                checkOut: reservationData.checkOut,
                total: `$${calculateTotal(reservationData.roomType, reservationData.checkIn, reservationData.checkOut)}`,
                status: 'confirmed'
            };
            
            reservations.unshift(newReservation);
            populateReservationsTable();
            
            // Close modal and reset form
            reservationModal.style.display = 'none';
            reservationForm.reset();
            
            // Show success message
            showNotification('Reservation created successfully!');
        });
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Calculate total price (simple demo calculation)
    function calculateTotal(roomType, checkIn, checkOut) {
        const rates = {
            'standard': 80,
            'deluxe': 150,
            'suite': 200,
            'executive': 300
        };
        
        const rate = rates[roomType] || 100;
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        
        return (rate * nights).toLocaleString();
    }
    
    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
            <span class="notification-close">&times;</span>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#4caf50';
        notification.style.color = 'white';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        notification.style.zIndex = '1000';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.justifyContent = 'space-between';
        notification.style.minWidth = '300px';
        notification.style.animation = 'slideIn 0.3s forwards';
        
        // Add animation
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes slideIn {
                from {transform: translateX(100%); opacity: 0;}
                to {transform: translateX(0); opacity: 1;}
            }
            @keyframes slideOut {
                from {transform: translateX(0); opacity: 1;}
                to {transform: translateX(100%); opacity: 0;}
            }
            .notification-content {
                display: flex;
                align-items: center;
            }
            .notification-content i {
                margin-right: 10px;
            }
            .notification-close {
                cursor: pointer;
                font-size: 20px;
                margin-left: 15px;
            }
        `;
        document.head.appendChild(style);
        
        // Close notification
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            notification.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto close after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Populate reservations table
    function populateReservationsTable() {
        const tableBody = document.getElementById('reservation-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        reservations.forEach(res => {
            const row = document.createElement('tr');
            
            // Format date from YYYY-MM-DD to MMM DD, YYYY
            const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                const options = { month: 'short', day: 'numeric', year: 'numeric' };
                return date.toLocaleDateString('en-US', options);
            };
            
            // Get status class
            const getStatusClass = (status) => {
                switch(status) {
                    case 'confirmed': return 'arriving';
                    case 'in-house': return 'in-house';
                    case 'checked-out': return 'departing';
                    default: return '';
                }
            };
            
            // Get status display text
            const getStatusText = (status) => {
                switch(status) {
                    case 'confirmed': return 'Confirmed';
                    case 'in-house': return 'In House';
                    case 'checked-out': return 'Checked Out';
                    default: return status;
                }
            };
            
            row.innerHTML = `
                <td>${res.id}</td>
                <td>${res.guestName}</td>
                <td>${res.roomType}</td>
                <td>${formatDate(res.checkIn)}</td>
                <td>${formatDate(res.checkOut)}</td>
                <td>${res.total}</td>
                <td><span class="status ${getStatusClass(res.status)}">${getStatusText(res.status)}</span></td>
                <td>
                    <button class="btn-action view-reservation" data-id="${res.id}"><i class="fas fa-eye"></i></button>
                    <button class="btn-action edit-reservation" data-id="${res.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete-reservation" data-id="${res.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        const viewButtons = document.querySelectorAll('.view-reservation');
        const editButtons = document.querySelectorAll('.edit-reservation');
        const deleteButtons = document.querySelectorAll('.delete-reservation');
        
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const resId = this.getAttribute('data-id');
                viewReservation(resId);
            });
        });
        
        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const resId = this.getAttribute('data-id');
                editReservation(resId);
            });
        });
        
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const resId = this.getAttribute('data-id');
                deleteReservation(resId);
            });
        });
    }
    
    // View reservation details
    function viewReservation(resId) {
        // Find reservation
        const reservation = reservations.find(res => res.id === resId);
        if (!reservation) return;
        
        // Here you would typically show a modal with the details
        console.log('Viewing reservation:', reservation);
        alert(`Viewing reservation: ${resId}\n\nGuest: ${reservation.guestName}\nRoom: ${reservation.roomType}\nDates: ${reservation.checkIn} to ${reservation.checkOut}`);
    }
    
    // Edit reservation
    function editReservation(resId) {
        // Find reservation
        const reservation = reservations.find(res => res.id === resId);
        if (!reservation) return;
        
        // Here you would typically open a form with the reservation data
        console.log('Editing reservation:', reservation);
        alert(`Editing reservation: ${resId}`);
    }
    
    // Delete reservation
    function deleteReservation(resId) {
        if (confirm(`Are you sure you want to delete reservation ${resId}?`)) {
            // Remove from array
            const index = reservations.findIndex(res => res.id === resId);
            if (index !== -1) {
                reservations.splice(index, 1);
                populateReservationsTable();
                showNotification('Reservation deleted successfully!');
            }
        }
    }
    
    // Setup date validation
    function setupDateValidation() {
        const checkInDate = document.getElementById('check-in-date');
        const checkOutDate = document.getElementById('check-out-date');
        
        if (!checkInDate || !checkOutDate) return;
        
        // Set minimum date for check-in to today
        const today = new Date().toISOString().split('T')[0];
        checkInDate.setAttribute('min', today);
        
        // Update check-out min date when check-in changes
        checkInDate.addEventListener('change', function() {
            const selectedDate = this.value;
            checkOutDate.setAttribute('min', selectedDate);
            
            // If check-out date is before check-in date, reset it
            if (checkOutDate.value && checkOutDate.value < selectedDate) {
                checkOutDate.value = selectedDate;
            }
        });
    }
    // Guest Management Functions
function setupGuestManagement() {
    // DOM Elements
    const guestTableBody = document.getElementById('guest-table-body');
    const guestModal = document.getElementById('guest-modal');
    const guestDetailsModal = document.getElementById('guest-details-modal');
    const guestForm = document.getElementById('guest-form');
    const newGuestBtn = document.getElementById('new-guest-btn');
    const cancelGuestBtn = document.getElementById('cancel-guest');
    const closeGuestDetailsBtn = document.getElementById('close-guest-details');
    const guestSearch = document.getElementById('guest-search');
    const searchGuestsBtn = document.getElementById('search-guests-btn');
    const guestFilter = document.getElementById('guest-filter');
    
    // Only proceed if guest management elements exist
    if (!guestTableBody) return;
    
    // Event Listeners
    newGuestBtn.addEventListener('click', openGuestModal);
    cancelGuestBtn.addEventListener('click', closeGuestModal);
    closeGuestDetailsBtn.addEventListener('click', closeGuestDetailsModal);
    guestForm.addEventListener('submit', handleGuestFormSubmit);
    if (searchGuestsBtn) searchGuestsBtn.addEventListener('click', searchGuests);
    if (guestSearch) guestSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchGuests();
    });
    guestFilter.addEventListener('change', filterGuests);
    
    // Load initial guests
    loadGuests();
    
    function loadGuests(searchTerm = '', filter = 'all') {
        let url = '/api/guests';
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        
        fetch(url)
            .then(response => response.json())
            .then(guests => {
                // Apply filter
                if (filter === 'frequent') {
                    guests = guests.filter(g => g.reservation_count >= 3);
                } else if (filter === 'vip') {
                    guests = guests.filter(g => g.notes && g.notes.toLowerCase().includes('vip'));
                }
                
                renderGuestTable(guests);
            })
            .catch(error => {
                console.error('Error loading guests:', error);
                showNotification('Failed to load guests', 'error');
            });
    }
    
    function renderGuestTable(guests) {
        guestTableBody.innerHTML = '';
        
        if (guests.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6">No guests found</td>';
            guestTableBody.appendChild(row);
            return;
        }
        
        guests.forEach(guest => {
            const row = document.createElement('tr');
            
            // Format last stay date
            const lastStay = guest.last_stay ? new Date(guest.last_stay).toLocaleDateString() : 'Never';
            
            row.innerHTML = `
                <td>${guest.name}</td>
                <td>${guest.email}</td>
                <td>${guest.phone || 'N/A'}</td>
                <td>${guest.reservation_count || 0}</td>
                <td>${lastStay}</td>
                <td>
                    <button class="btn-action view-guest" data-id="${guest.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit-guest" data-id="${guest.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            
            guestTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.view-guest').forEach(btn => {
            btn.addEventListener('click', function() {
                const guestId = this.getAttribute('data-id');
                viewGuestDetails(guestId);
            });
        });
        
        document.querySelectorAll('.edit-guest').forEach(btn => {
            btn.addEventListener('click', function() {
                const guestId = this.getAttribute('data-id');
                editGuest(guestId);
            });
        });
    }
    
    function openGuestModal() {
        document.getElementById('guest-modal-title').textContent = 'New Guest';
        document.getElementById('guest-id').value = '';
        guestForm.reset();
        guestModal.style.display = 'block';
    }
    
    function closeGuestModal() {
        guestModal.style.display = 'none';
    }
    
    function closeGuestDetailsModal() {
        guestDetailsModal.style.display = 'none';
    }
    
    function viewGuestDetails(guestId) {
        fetch(`/api/guests/${guestId}`)
            .then(response => response.json())
            .then(guest => {
                // Populate guest details
                document.getElementById('guest-details-name').textContent = guest.name;
                document.getElementById('guest-details-email').textContent = guest.email;
                document.getElementById('guest-details-phone').textContent = guest.phone || 'N/A';
                document.getElementById('guest-details-address').textContent = guest.address || 'N/A';
                document.getElementById('guest-details-notes').textContent = guest.notes || 'No notes';
                
                // Format dates
                const createdDate = new Date(guest.created_at);
                document.getElementById('guest-details-created').textContent = 
                    createdDate.toLocaleDateString() + ' at ' + createdDate.toLocaleTimeString();
                
                // Show VIP badge if applicable
                const vipBadge = document.getElementById('guest-details-vip');
                if (guest.notes && guest.notes.toLowerCase().includes('vip')) {
                    vipBadge.style.display = 'inline-block';
                } else {
                    vipBadge.style.display = 'none';
                }
                
                // Populate reservations
                const reservationsBody = document.getElementById('guest-reservations-body');
                reservationsBody.innerHTML = '';
                
                if (guest.reservations && guest.reservations.length > 0) {
                    guest.reservations.forEach(res => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>RES-${res.id.toString().padStart(4, '0')}</td>
                            <td>${res.room_type_name}</td>
                            <td>${res.check_in_date}</td>
                            <td>${res.check_out_date}</td>
                            <td>$${res.total_price.toFixed(2)}</td>
                            <td><span class="status ${res.status.toLowerCase().replace(' ', '-')}">${res.status}</span></td>
                        `;
                        reservationsBody.appendChild(row);
                    });
                } else {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="6">No reservations found</td>';
                    reservationsBody.appendChild(row);
                }
                
                // Show modal
                guestDetailsModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error loading guest details:', error);
                showNotification('Failed to load guest details', 'error');
            });
    }
    
    function editGuest(guestId) {
        fetch(`/api/guests/${guestId}`)
            .then(response => response.json())
            .then(guest => {
                document.getElementById('guest-modal-title').textContent = 'Edit Guest';
                document.getElementById('guest-id').value = guest.id;
                document.getElementById('guest-name').value = guest.name;
                document.getElementById('guest-email').value = guest.email;
                document.getElementById('guest-phone').value = guest.phone || '';
                document.getElementById('guest-address').value = guest.address || '';
                document.getElementById('guest-notes').value = guest.notes || '';
                
                // Check VIP status (assuming it's stored in notes)
                const vipCheckbox = document.getElementById('guest-vip');
                vipCheckbox.checked = guest.notes && guest.notes.toLowerCase().includes('vip');
                
                guestModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error loading guest for edit:', error);
                showNotification('Failed to load guest for editing', 'error');
            });
    }
    
    function handleGuestFormSubmit(e) {
        e.preventDefault();
        
        const guestId = document.getElementById('guest-id').value;
        const formData = new FormData(guestForm);
        const guestData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            notes: formData.get('notes')
        };
        
        // Add VIP note if checked
        if (document.getElementById('guest-vip').checked) {
            guestData.notes = (guestData.notes ? guestData.notes + '\n' : '') + 'VIP Guest';
        }
        
        const method = guestId ? 'PUT' : 'POST';
        const url = guestId ? `/api/guests/${guestId}` : '/api/guests';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(guestData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Failed to save guest');
                });
            }
            return response.json();
        })
        .then(data => {
            closeGuestModal();
            loadGuests();
            showNotification(guestId ? 'Guest updated successfully' : 'Guest created successfully');
        })
        .catch(error => {
            console.error('Error saving guest:', error);
            showNotification(error.message, 'error');
        });
    }
    
    function searchGuests() {
        const searchTerm = guestSearch.value.trim();
        loadGuests(searchTerm, guestFilter.value);
    }
    
    function filterGuests() {
        loadGuests(guestSearch.value.trim(), guestFilter.value);
    }
}

// Update the init function to include guest management setup
function init() {
    setupNavigation();
    renderAvailabilityChart();
    setupReservationModal();
    populateReservationsTable();
    setupDateValidation();
    setupGuestManagement(); // Add this line
}

// Service Management Functions
function setupServiceManagement() {
    const serviceTableBody = document.getElementById('service-table-body');
    const serviceModal = document.getElementById('service-modal');
    const serviceForm = document.getElementById('service-form');
    const newServiceBtn = document.getElementById('new-service-btn');
    const cancelServiceBtn = document.getElementById('cancel-service');
    const serviceSearch = document.getElementById('service-search');
    const searchServicesBtn = document.getElementById('search-services-btn');
    const serviceFilter = document.getElementById('service-filter');

    if (!serviceTableBody) return;

    // Event Listeners
    newServiceBtn.addEventListener('click', openServiceModal);
    cancelServiceBtn.addEventListener('click', closeServiceModal);
    serviceForm.addEventListener('submit', handleServiceFormSubmit);
    searchServicesBtn.addEventListener('click', loadServices);
    serviceSearch.addEventListener('keypress', (e) => e.key === 'Enter' && loadServices());
    serviceFilter.addEventListener('change', loadServices);
    window.addEventListener('click', (e) => e.target === serviceModal && closeServiceModal());
    document.querySelectorAll('#service-modal .close').forEach(btn => 
        btn.addEventListener('click', closeServiceModal));

    // Load initial services
    loadServices();

    function loadServices() {
        const searchTerm = serviceSearch.value.trim();
        const filter = serviceFilter.value;
        
        let url = '/api/services';
        const params = new URLSearchParams();
        
        if (searchTerm) params.append('search', searchTerm);
        if (filter !== 'all') params.append('status', filter);
        
        if (params.toString()) url += `?${params.toString()}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(services => {
                renderServiceTable(services);
            })
            .catch(error => {
                console.error('Error loading services:', error);
                showNotification('Failed to load services. Please try again.', 'error');
            });
    }

    function renderServiceTable(services) {
        serviceTableBody.innerHTML = '';
        
        if (!services || services.length === 0) {
            serviceTableBody.innerHTML = '<tr><td colspan="5">No services found</td></tr>';
            return;
        }

        services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.name}</td>
                <td>${formatServiceType(service.type)}</td>
                <td>${service.price.toLocaleString('en-US', {style:'currency', currency:'USD'})}</td>
                <td><span class="status ${service.status}">${service.status.charAt(0).toUpperCase() + service.status.slice(1)}</span></td>
                <td>
                    <button class="btn-action edit-service" data-id="${service.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete-service" data-id="${service.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            serviceTableBody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.edit-service').forEach(btn => {
            btn.addEventListener('click', () => editService(btn.dataset.id));
        });

        document.querySelectorAll('.delete-service').forEach(btn => {
            btn.addEventListener('click', () => deleteService(btn.dataset.id));
        });
    }

    function formatServiceType(type) {
        const types = {
            'room-service': 'Room Service',
            'cleaning': 'Cleaning',
            'transport': 'Transport',
            'spa': 'Spa',
            'other': 'Other'
        };
        return types[type] || type;
    }

    function openServiceModal() {
        document.getElementById('service-modal-title').textContent = 'New Service';
        document.getElementById('service-id').value = '';
        serviceForm.reset();
        serviceModal.style.display = 'block';
    }

    function closeServiceModal() {
        serviceModal.style.display = 'none';
    }

    function editService(serviceId) {
        fetch(`/api/services/${serviceId}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch service');
                return response.json();
            })
            .then(service => {
                document.getElementById('service-modal-title').textContent = 'Edit Service';
                document.getElementById('service-id').value = service.id;
                document.getElementById('service-name').value = service.name;
                document.getElementById('service-type').value = service.type;
                document.getElementById('service-price').value = service.price;
                document.getElementById('service-status').value = service.status;
                document.getElementById('service-description').value = service.description || '';
                serviceModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching service:', error);
                showNotification('Failed to load service details', 'error');
            });
    }

    function handleServiceFormSubmit(e) {
        e.preventDefault();
        
        const serviceId = document.getElementById('service-id').value;
        const formData = new FormData(serviceForm);
        const price = parseFloat(formData.get('price'));
        
        if (isNaN(price) || price <= 0) {
            showNotification('Please enter a valid positive price', 'error');
            return;
        }

        const serviceData = {
            name: formData.get('name').trim(),
            type: formData.get('type'),
            price: price,
            status: formData.get('status'),
            description: formData.get('description').trim()
        };

        const method = serviceId ? 'PUT' : 'POST';
        const url = serviceId ? `/api/services/${serviceId}` : '/api/services';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(serviceData)
        })
        .then(response => {
            if (!response.ok) return response.json().then(err => { throw new Error(err.error); });
            return response.json();
        })
        .then(data => {
            closeServiceModal();
            loadServices();
            showNotification(data.message || (serviceId ? 'Service updated' : 'Service created'));
        })
        .catch(error => {
            console.error('Error saving service:', error);
            showNotification(error.message || 'Failed to save service', 'error');
        });
    }

    function deleteService(serviceId) {
        if (!confirm('Are you sure you want to delete this service?')) return;
        
        fetch(`/api/services/${serviceId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) return response.json().then(err => { throw new Error(err.error); });
                return response.json();
            })
            .then(data => {
                loadServices();
                showNotification(data.message || 'Service deleted');
            })
            .catch(error => {
                console.error('Error deleting service:', error);
                showNotification(error.message || 'Failed to delete service', 'error');
            });
    }
}

// Billing Management Functions
function setupBillingManagement() {
    // DOM Elements
    const billingTableBody = document.getElementById('billing-table-body');
    const billModal = document.getElementById('bill-modal');
    const generateBillModal = document.getElementById('generate-bill-modal');
    const generateBillBtn = document.getElementById('generate-bill-btn');
    const billingSearch = document.getElementById('billing-search');
    const searchBillingBtn = document.getElementById('search-billing-btn');
    const billingFilter = document.getElementById('billing-filter');
    const paymentForm = document.getElementById('payment-form');
    const generateBillForm = document.getElementById('generate-bill-form');
    const cancelGenerateBillBtn = document.getElementById('cancel-generate-bill');

    // Only proceed if billing management elements exist
    if (!billingTableBody) return;

    // Event Listeners
    generateBillBtn?.addEventListener('click', openGenerateBillModal);
    cancelGenerateBillBtn?.addEventListener('click', closeGenerateBillModal);
    searchBillingBtn?.addEventListener('click', loadBilling);
    billingSearch?.addEventListener('keypress', (e) => e.key === 'Enter' && loadBilling());
    billingFilter?.addEventListener('change', loadBilling);
    paymentForm?.addEventListener('submit', handlePaymentSubmit);
    generateBillForm?.addEventListener('submit', handleGenerateBillSubmit);
    window.addEventListener('click', (e) => {
        if (e.target === billModal) closeBillModal();
        if (e.target === generateBillModal) closeGenerateBillModal();
    });
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', () => {
            if (billModal.style.display === 'block') closeBillModal();
            if (generateBillModal.style.display === 'block') closeGenerateBillModal();
        });
    });

    // Load initial billing records
    loadBilling();

    function loadBilling() {
        const searchTerm = billingSearch.value.trim();
        const filter = billingFilter.value;
        
        let url = '/api/billing';
        const params = new URLSearchParams();
        
        if (searchTerm) params.append('search', searchTerm);
        if (filter !== 'all') params.append('status', filter);
        
        if (params.toString()) url += `?${params.toString()}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(bills => {
                renderBillingTable(bills);
            })
            .catch(error => {
                console.error('Error loading billing records:', error);
                showNotification('Failed to load billing records. Please try again.', 'error');
            });
    }

    function renderBillingTable(bills) {
        billingTableBody.innerHTML = '';
        
        if (!bills || bills.length === 0) {
            billingTableBody.innerHTML = '<tr><td colspan="8">No billing records found</td></tr>';
            return;
        }

        bills.forEach(bill => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bill.id}</td>
                <td>${bill.guest_name}</td>
                <td>RES-${bill.reservation_id.toString().padStart(4, '0')}</td>
                <td>${formatCurrency(bill.total_amount)}</td>
                <td>${formatCurrency(bill.amount_paid || 0)}</td>
                <td>${formatCurrency(bill.balance_due || bill.total_amount)}</td>
                <td><span class="status ${bill.payment_status}">${formatStatus(bill.payment_status)}</span></td>
                <td>
                    <button class="btn-action view-bill" data-id="${bill.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            billingTableBody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.view-bill').forEach(btn => {
            btn.addEventListener('click', () => viewBillDetails(btn.dataset.id));
        });
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    function formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'paid': 'Paid',
            'partially_paid': 'Partially Paid',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    function viewBillDetails(billId) {
        fetch(`/api/billing/${billId}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch bill details');
                return response.json();
            })
            .then(data => {
                const bill = data.bill;
                const payments = data.payments;

                // Populate bill header
                document.getElementById('bill-number').textContent = bill.id;
                document.getElementById('bill-date').textContent = new Date(bill.created_at).toLocaleDateString();
                document.getElementById('bill-status').textContent = formatStatus(bill.payment_status);
                document.getElementById('bill-status').className = `status ${bill.payment_status}`;

                // Populate guest info
                document.getElementById('guest-name').textContent = bill.guest_name;
                document.getElementById('guest-email').textContent = bill.guest_email;
                document.getElementById('guest-phone').textContent = bill.guest_phone || 'N/A';

                // Populate reservation info
                document.getElementById('room-type').textContent = bill.room_type;
                document.getElementById('check-in-date').textContent = new Date(bill.check_in_date).toLocaleDateString();
                document.getElementById('check-out-date').textContent = new Date(bill.check_out_date).toLocaleDateString();

                // Populate charges
                document.getElementById('room-charge').textContent = formatCurrency(bill.room_charge);
                document.getElementById('service-charge').textContent = formatCurrency(bill.service_charges);
                document.getElementById('tax-amount').textContent = formatCurrency(bill.tax_amount);
                document.getElementById('total-amount').textContent = formatCurrency(bill.total_amount);
                document.getElementById('amount-paid').textContent = formatCurrency(bill.amount_paid || 0);
                document.getElementById('balance-due').textContent = formatCurrency(bill.balance_due || bill.total_amount);

                // Populate payment history
                const paymentHistoryBody = document.getElementById('payment-history-body');
                paymentHistoryBody.innerHTML = '';
                
                if (payments && payments.length > 0) {
                    payments.forEach(payment => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${new Date(payment.payment_date).toLocaleString()}</td>
                            <td>${formatCurrency(payment.amount)}</td>
                            <td>${payment.payment_method.replace('_', ' ').toUpperCase()}</td>
                            <td>${payment.transaction_id || 'N/A'}</td>
                        `;
                        paymentHistoryBody.appendChild(row);
                    });
                } else {
                    paymentHistoryBody.innerHTML = '<tr><td colspan="4">No payments recorded</td></tr>';
                }

                // Set billing ID for payment form
                document.getElementById('billing-id').value = bill.id;

                // Open modal
                document.getElementById('bill-modal-title').textContent = `Bill #${bill.id}`;
                billModal.style.display = 'block';
          
                    // Force recalculate modal height
                setTimeout(() => {
                    const modalContent = document.querySelector('.modal-content');
                    const modalBody = document.querySelector('.modal-body');
                    
                    // Set max height based on viewport
                    const maxHeight = window.innerHeight * 0.8; // 80% of viewport height
                    modalContent.style.maxHeight = `${maxHeight}px`;
                    modalBody.style.overflowY = 'auto';
                    modalBody.style.maxHeight = `${maxHeight - 120}px`; // Account for header/footer
                }, 10);
            })
            .catch(error => {
                console.error('Error fetching bill details:', error);
                showNotification('Failed to load bill details', 'error');
            });
    }

    function closeBillModal() {
        billModal.style.display = 'none';
        // Reset any styles we modified
        const modalContent = document.querySelector('.modal-content');
        const modalBody = document.querySelector('.modal-body');
        if (modalContent) {
            modalContent.style.maxHeight = '';
        }
        if (modalBody) {
            modalBody.style.overflowY = '';
            modalBody.style.maxHeight = '';
        }
    }


    function handlePaymentSubmit(e) {
        e.preventDefault();
        
        const billingId = document.getElementById('billing-id').value;
        const amount = parseFloat(document.getElementById('payment-amount').value);
        const method = document.getElementById('payment-method').value;
        const transactionId = document.getElementById('transaction-id').value;
        const notes = document.getElementById('payment-notes').value;

        if (isNaN(amount) || amount <= 0) {
            showNotification('Please enter a valid positive amount', 'error');
            return;
        }

        if (!method) {
            showNotification('Please select a payment method', 'error');
            return;
        }

        fetch(`/api/billing/${billingId}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                payment_method: method,
                transaction_id: transactionId,
                notes: notes
            })
        })
        .then(response => {
            if (!response.ok) return response.json().then(err => { throw new Error(err.error); });
            return response.json();
        })
        .then(data => {
            showNotification(data.message || 'Payment recorded successfully');
            viewBillDetails(billingId); // Refresh the bill details
            loadBilling(); // Refresh the billing list
            paymentForm.reset();
        })
        .catch(error => {
            console.error('Error recording payment:', error);
            showNotification(error.message || 'Failed to record payment', 'error');
        });
    }

    function openGenerateBillModal() {
        generateBillForm.reset();
        generateBillModal.style.display = 'block';
    }

    function closeGenerateBillModal() {
        generateBillModal.style.display = 'none';
    }

    function closeBillModal() {
        billModal.style.display = 'none';
        // Remove scrollable class when closing modal
        const modalContent = document.querySelector('.modal-content');
        modalContent?.classList.remove('scrollable-modal');
    }

    function handleGenerateBillSubmit(e) {
        e.preventDefault();
        
        const reservationId = document.getElementById('reservation-id').value;
        
        if (!reservationId) {
            showNotification('Please enter a reservation ID', 'error');
            return;
        }

        fetch('/api/billing/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reservation_id: reservationId
            })
        })
        .then(response => {
            if (!response.ok) return response.json().then(err => { throw new Error(err.error); });
            return response.json();
        })
        .then(data => {
            showNotification(data.message || 'Bill generated successfully');
            closeGenerateBillModal();
            loadBilling();
        })
        .catch(error => {
            console.error('Error generating bill:', error);
            showNotification(error.message || 'Failed to generate bill', 'error');
        });
    }
}

// Reports Management Functions
function setupReports() {
    const reportTypeSelect = document.getElementById('report-type');
    const dateRangeSelect = document.getElementById('date-range');
    const customDateRange = document.getElementById('custom-date-range');
    const generateReportBtn = document.getElementById('generate-report');
    const exportReportBtn = document.getElementById('export-report');
    const reportSections = document.querySelectorAll('.report-section');
    const reportLoading = document.querySelector('.report-loading');
    
    // Charts
    let occupancyChart, revenueChart, guestChart;
    
    // Initialize charts
    function initCharts() {
        const occupancyCtx = document.getElementById('occupancy-chart').getContext('2d');
        const revenueCtx = document.getElementById('revenue-chart').getContext('2d');
        const guestCtx = document.getElementById('guest-chart').getContext('2d');
        
        occupancyChart = new Chart(occupancyCtx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: chartOptions('Occupancy Rate (%)')
        });
        
        revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: { labels: [], datasets: [] },
            options: chartOptions('Revenue ($)')
        });
        
        guestChart = new Chart(guestCtx, {
            type: 'pie',
            data: { labels: [], datasets: [] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    function chartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: title },
                legend: { position: 'bottom' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            }
        };
    }
    
    // Toggle custom date range
    dateRangeSelect.addEventListener('change', function() {
        customDateRange.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    
    // Generate report
    generateReportBtn.addEventListener('click', function() {
        const reportType = reportTypeSelect.value;
        const dateRange = dateRangeSelect.value;
        let startDate, endDate;
        
        // Calculate dates based on selection
        const today = new Date();
        switch(dateRange) {
            case 'today':
                startDate = endDate = formatDate(today);
                break;
            case 'week':
                startDate = formatDate(new Date(today.setDate(today.getDate() - today.getDay())));
                endDate = formatDate(new Date(today.setDate(today.getDate() + 6)));
                break;
            case 'month':
                startDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
                endDate = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
                break;
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = formatDate(new Date(today.getFullYear(), quarter * 3, 1));
                endDate = formatDate(new Date(today.getFullYear(), quarter * 3 + 3, 0));
                break;
            case 'year':
                startDate = formatDate(new Date(today.getFullYear(), 0, 1));
                endDate = formatDate(new Date(today.getFullYear(), 11, 31));
                break;
            case 'custom':
                startDate = document.getElementById('start-date').value;
                endDate = document.getElementById('end-date').value;
                if (!startDate || !endDate) {
                    showNotification('Please select both start and end dates', 'error');
                    return;
                }
                break;
        }
        
        // Show loading
        reportLoading.style.display = 'block';
        reportSections.forEach(section => section.style.display = 'none');
        
        // Fetch report data
        fetchReportData(reportType, startDate, endDate);
    });
    
    function fetchReportData(reportType, startDate, endDate) {
        let endpoint = '';
        switch(reportType) {
            case 'occupancy':
                endpoint = `/api/reports/occupancy?start_date=${startDate}&end_date=${endDate}`;
                break;
            case 'revenue':
                endpoint = `/api/reports/revenue?start_date=${startDate}&end_date=${endDate}`;
                break;
            case 'guest':
                endpoint = `/api/reports/guest?start_date=${startDate}&end_date=${endDate}`;
                break;
        }
        
        fetch(endpoint)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                displayReport(reportType, data);
                exportReportBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error fetching report:', error);
                showNotification('Failed to generate report: ' + error.message, 'error');
            })
            .finally(() => {
                reportLoading.style.display = 'none';
            });
    }
    
    function displayReport(reportType, data) {
        // Hide all sections first
        reportSections.forEach(section => section.style.display = 'none');
        
        // Show the selected report section
        const activeSection = document.getElementById(`${reportType}-report`);
        activeSection.style.display = 'block';
        
        // Update the report content based on type
        switch(reportType) {
            case 'occupancy':
                updateOccupancyReport(data);
                break;
            case 'revenue':
                updateRevenueReport(data);
                break;
            case 'guest':
                updateGuestReport(data);
                break;
        }
    }
    
    function updateOccupancyReport(data) {
        // Update chart
        const labels = data.daily_occupancy.map(item => item.date);
        const occupiedData = data.daily_occupancy.map(item => item.occupied_rooms);
        const availableData = data.daily_occupancy.map(item => item.available_rooms);
        
        occupancyChart.data.labels = labels;
        occupancyChart.data.datasets = [
            {
                label: 'Occupied Rooms',
                data: occupiedData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            },
            {
                label: 'Available Rooms',
                data: availableData,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.1
            }
        ];
        occupancyChart.update();
        
        // Update table
        const tableBody = document.getElementById('occupancy-table-body');
        tableBody.innerHTML = '';
        
        data.daily_occupancy.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.date}</td>
                <td>${item.occupied_rooms}</td>
                <td>${item.available_rooms}</td>
                <td>${item.occupancy_rate}%</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    function updateRevenueReport(data) {
        // Similar implementation for revenue report
        // ...
    }
    
    function updateGuestReport(data) {
        // Similar implementation for guest report
        // ...
    }
    
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    // Initialize
    initCharts();
}

// Settings Management Functions
function setupSettings() {
    console.log('Initializing settings...');
    
    // Get tab elements with proper nesting
    const tabLinks = document.querySelectorAll('.settings-tabs .tab-nav .tab-link');
    const tabContents = document.querySelectorAll('.settings-tabs .tab-content');
    
    console.log(`Found ${tabLinks.length} tabs and ${tabContents.length} contents`);

    // Add click handlers to each tab
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            console.log(`Clicked tab: ${tabId}`);
            
            // Remove active class from all tabs
            tabLinks.forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // Hide all content
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.setAttribute('aria-hidden', 'true');
            });
            
            // Show the selected content - FIXED: Match the tab content ID pattern in your HTML
            const activeContent = document.getElementById(`${tabId}-tab`);
            if (activeContent) {
                activeContent.classList.add('active');
                activeContent.setAttribute('aria-hidden', 'false');
                console.log(`Showing content for ${tabId}`);
                
                // Load content only when tab is activated
                switch(tabId) {
                    case 'general':
                        loadGeneralSettings();
                        break;
                    case 'room-types':
                        setupRoomTypeManagement();
                        break;
                    case 'taxes':
                        setupTaxSettings();
                        break;
                    case 'users':
                        setupUserManagement();
                        break;
                    case 'notifications':
                        setupNotificationSettings();
                        break;
                }
            } else {
                console.error(`Content not found for tab: ${tabId}`);
            }
        });
    });

    // Activate the first tab by default if none are active
    const activeTab = document.querySelector('.settings-tabs .tab-nav .tab-link.active');
    if (!activeTab && tabLinks.length > 0) {
        tabLinks[0].click();
    }

    
    // Form submission handlers
    document.getElementById('general-settings-form')?.addEventListener('submit', saveGeneralSettings);
    document.getElementById('tax-settings-form')?.addEventListener('submit', saveTaxSettings);
    document.getElementById('notification-settings-form')?.addEventListener('submit', saveNotificationSettings);
}

function loadGeneralSettings() {
    fetch('/api/settings/general')
        .then(response => response.json())
        .then(settings => {
            document.getElementById('hotel-name').value = settings.hotel_name || '';
            document.getElementById('hotel-address').value = settings.hotel_address || '';
            document.getElementById('hotel-phone').value = settings.hotel_phone || '';
            document.getElementById('hotel-email').value = settings.hotel_email || '';
            document.getElementById('currency').value = settings.currency || 'USD';
            document.getElementById('timezone').value = settings.timezone || 'UTC';
            document.getElementById('checkin-time').value = settings.checkin_time || '14:00';
            document.getElementById('checkout-time').value = settings.checkout_time || '12:00';
        })
        .catch(error => {
            console.error('Error loading general settings:', error);
            showNotification('Failed to load general settings', 'error');
        });
}

function saveGeneralSettings(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const settings = {
        hotel_name: formData.get('hotel_name'),
        hotel_address: formData.get('hotel_address'),
        hotel_phone: formData.get('hotel_phone'),
        hotel_email: formData.get('hotel_email'),
        currency: formData.get('currency'),
        timezone: formData.get('timezone'),
        checkin_time: formData.get('checkin_time'),
        checkout_time: formData.get('checkout_time')
    };
    
    fetch('/api/settings/general', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save settings');
        return response.json();
    })
    .then(data => {
        showNotification('General settings saved successfully');
    })
    .catch(error => {
        console.error('Error saving general settings:', error);
        showNotification('Failed to save general settings', 'error');
    });
}

function setupRoomTypeManagement() {
    const newRoomTypeBtn = document.getElementById('new-room-type-btn');
    const roomTypeModal = document.getElementById('room-type-modal');
    const roomTypeForm = document.getElementById('room-type-form');
    const cancelRoomTypeBtn = document.getElementById('cancel-room-type');
    
    // Common amenities (could be loaded from API)
    const commonAmenities = [
        'WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe', 
        'Hair Dryer', 'Coffee Maker', 'Iron', 'Room Service',
        'Daily Cleaning', 'Balcony', 'Ocean View'
    ];
    
    // Populate amenities checkboxes
    const amenitiesContainer = document.getElementById('amenities-container');
    commonAmenities.forEach(amenity => {
        const checkbox = document.createElement('div');
        checkbox.className = 'amenity-checkbox';
        checkbox.innerHTML = `
            <label>
                <input type="checkbox" name="amenities" value="${amenity}"> ${amenity}
            </label>
        `;
        amenitiesContainer.appendChild(checkbox);
    });
    
    // Load room types
    loadRoomTypes();
    
    // Event listeners
    newRoomTypeBtn?.addEventListener('click', openRoomTypeModal);
    cancelRoomTypeBtn?.addEventListener('click', closeRoomTypeModal);
    roomTypeForm?.addEventListener('submit', handleRoomTypeFormSubmit);
    
    function loadRoomTypes() {
        fetch('/api/room-types')
            .then(response => response.json())
            .then(roomTypes => {
                const tableBody = document.getElementById('room-types-table-body');
                tableBody.innerHTML = '';
                
                roomTypes.forEach(rt => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${rt.name}</td>
                        <td>$${rt.base_price}</td>
                        <td>${rt.room_count || 0}</td>
                        <td>${rt.amenities ? rt.amenities.split(',').slice(0, 3).join(', ') : ''}${rt.amenities && rt.amenities.split(',').length > 3 ? '...' : ''}</td>
                        <td>
                            <button class="btn-action edit-room-type" data-id="${rt.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action delete-room-type" data-id="${rt.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
                
                // Add event listeners to action buttons
                document.querySelectorAll('.edit-room-type').forEach(btn => {
                    btn.addEventListener('click', () => editRoomType(btn.dataset.id));
                });
                
                document.querySelectorAll('.delete-room-type').forEach(btn => {
                    btn.addEventListener('click', () => deleteRoomType(btn.dataset.id));
                });
            })
            .catch(error => {
                console.error('Error loading room types:', error);
                showNotification('Failed to load room types', error);
            });
    }
    
    function openRoomTypeModal() {
        document.getElementById('room-type-modal-title').textContent = 'New Room Type';
        document.getElementById('room-type-id').value = '';
        roomTypeForm.reset();
        roomTypeModal.style.display = 'block';
    }
    
    function closeRoomTypeModal() {
        roomTypeModal.style.display = 'none';
    }
    
    function editRoomType(id) {
        fetch(`/api/room-types/${id}`)
            .then(response => response.json())
            .then(roomType => {
                document.getElementById('room-type-modal-title').textContent = 'Edit Room Type';
                document.getElementById('room-type-id').value = roomType.id;
                document.getElementById('room-type-name').value = roomType.name;
                document.getElementById('room-type-price').value = roomType.base_price;
                document.getElementById('room-type-description').value = roomType.description || '';
                
                // Check amenities
                const amenities = roomType.amenities ? JSON.parse(roomType.amenities) : [];
                document.querySelectorAll('#amenities-container input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = amenities.includes(checkbox.value);
                });
                
                roomTypeModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error loading room type:', error);
                showNotification('Failed to load room type', 'error');
            });
    }
    
    function handleRoomTypeFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const checkedAmenities = Array.from(document.querySelectorAll('#amenities-container input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        
        const roomTypeData = {
            name: formData.get('name'),
            base_price: formData.get('base_price'),
            description: formData.get('description'),
            amenities: checkedAmenities
        };
        
        const id = document.getElementById('room-type-id').value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/room-types/${id}` : '/api/room-types';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(roomTypeData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to save room type');
            return response.json();
        })
        .then(data => {
            showNotification('Room type saved successfully');
            closeRoomTypeModal();
            loadRoomTypes();
        })
        .catch(error => {
            console.error('Error saving room type:', error);
            showNotification('Failed to save room type', 'error');
        });
    }
    
    function deleteRoomType(id) {
        if (!confirm('Are you sure you want to delete this room type? This action cannot be undone.')) return;
        
        fetch(`/api/room-types/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to delete room type');
            return response.json();
        })
        .then(data => {
            showNotification('Room type deleted successfully');
            loadRoomTypes();
        })
        .catch(error => {
            console.error('Error deleting room type:', error);
            showNotification('Failed to delete room type', 'error');
        });
    }
}

function setupTaxSettings() {
    fetch('/api/settings/taxes')
        .then(response => response.json())
        .then(settings => {
            document.getElementById('tax-rate').value = settings.tax_rate || 0;
            document.getElementById('service-fee').value = settings.service_fee || 0;
            document.getElementById('reservation-fee').value = settings.reservation_fee || 0;
            document.getElementById('city-tax').value = settings.city_tax || 0;
            document.getElementById('tax-inclusive').checked = settings.tax_inclusive || false;
        })
        .catch(error => {
            console.error('Error loading tax settings:', error);
            showNotification('Failed to load tax settings', 'error');
        });
}

function saveTaxSettings(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const settings = {
        tax_rate: formData.get('tax_rate'),
        service_fee: formData.get('service_fee'),
        reservation_fee: formData.get('reservation_fee'),
        city_tax: formData.get('city_tax'),
        tax_inclusive: formData.get('tax_inclusive') === 'on'
    };
    
    fetch('/api/settings/taxes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save tax settings');
        return response.json();
    })
    .then(data => {
        showNotification('Tax settings saved successfully');
    })
    .catch(error => {
        console.error('Error saving tax settings:', error);
        showNotification('Failed to save tax settings', 'error');
    });
}

function setupUserManagement() {
    const newUserBtn = document.getElementById('new-user-btn');
    const userModal = document.getElementById('user-modal');
    const userForm = document.getElementById('user-form');
    const cancelUserBtn = document.getElementById('cancel-user');
    
    // Load users
    loadUsers();
    
    // Event listeners
    newUserBtn?.addEventListener('click', openUserModal);
    cancelUserBtn?.addEventListener('click', closeUserModal);
    userForm?.addEventListener('submit', handleUserFormSubmit);
    
    function loadUsers() {
        fetch('/api/users')
            .then(response => response.json())
            .then(users => {
                const tableBody = document.getElementById('users-table-body');
                tableBody.innerHTML = '';
                
                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.username}</td>
                        <td>${user.first_name} ${user.last_name}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                        <td><span class="status ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                            <button class="btn-action edit-user" data-id="${user.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${user.id !== session.user_id ? `
                            <button class="btn-action delete-user" data-id="${user.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
                
                // Add event listeners to action buttons
                document.querySelectorAll('.edit-user').forEach(btn => {
                    btn.addEventListener('click', () => editUser(btn.dataset.id));
                });
                
                document.querySelectorAll('.delete-user').forEach(btn => {
                    btn.addEventListener('click', () => deleteUser(btn.dataset.id));
                });
            })
            .catch(error => {
                console.error('Error loading users:', error);
                showNotification('Failed to load users', 'error');
            });
    }
    
    function openUserModal() {
        document.getElementById('user-modal-title').textContent = 'New User';
        document.getElementById('user-id').value = '';
        userForm.reset();
        userModal.style.display = 'block';
    }
    
    function closeUserModal() {
        userModal.style.display = 'none';
    }
    
    function editUser(id) {
        fetch(`/api/users/${id}`)
            .then(response => response.json())
            .then(user => {
                document.getElementById('user-modal-title').textContent = 'Edit User';
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-username').value = user.username;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-first-name').value = user.first_name;
                document.getElementById('user-last-name').value = user.last_name;
                document.getElementById('user-role').value = user.role;
                document.getElementById('user-active').checked = user.is_active;
                document.getElementById('user-password').required = false;
                
                userModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error loading user:', error);
                showNotification('Failed to load user', 'error');
            });
    }
    
    function handleUserFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            password: formData.get('password'),
            role: formData.get('role'),
            is_active: formData.get('is_active') === 'on'
        };
        
        const id = document.getElementById('user-id').value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/users/${id}` : '/api/users';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to save user');
            return response.json();
        })
        .then(data => {
            showNotification('User saved successfully');
            closeUserModal();
            loadUsers();
        })
        .catch(error => {
            console.error('Error saving user:', error);
            showNotification('Failed to save user', 'error');
        });
    }
    
    function deleteUser(id) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        
        fetch(`/api/users/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to delete user');
            return response.json();
        })
        .then(data => {
            showNotification('User deleted successfully');
            loadUsers();
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            showNotification('Failed to delete user', 'error');
        });
    }
}

function setupNotificationSettings() {
    fetch('/api/settings/notifications')
        .then(response => response.json())
        .then(settings => {
            document.getElementById('enable-email').checked = settings.enable_email || false;
            document.getElementById('smtp-host').value = settings.smtp_host || '';
            document.getElementById('smtp-port').value = settings.smtp_port || '';
            document.getElementById('smtp-username').value = settings.smtp_username || '';
            document.getElementById('smtp-password').value = '';
            document.getElementById('smtp-ssl').checked = settings.smtp_ssl || false;
            document.getElementById('notify-new-reservation').checked = settings.notify_new_reservation || false;
            document.getElementById('notify-checkin').checked = settings.notify_checkin || false;
            document.getElementById('notify-checkout').checked = settings.notify_checkout || false;
            document.getElementById('notify-maintenance').checked = settings.notify_maintenance || false;
        })
        .catch(error => {
            console.error('Error loading notification settings:', error);
            showNotification('Failed to load notification settings', 'error');
        });
}

function saveNotificationSettings(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const settings = {
        enable_email: formData.get('enable_email') === 'on',
        smtp_host: formData.get('smtp_host'),
        smtp_port: formData.get('smtp_port'),
        smtp_username: formData.get('smtp_username'),
        smtp_password: formData.get('smtp_password'),
        smtp_ssl: formData.get('smtp_ssl') === 'on',
        notify_new_reservation: formData.get('notify_new_reservation') === 'on',
        notify_checkin: formData.get('notify_checkin') === 'on',
        notify_checkout: formData.get('notify_checkout') === 'on',
        notify_maintenance: formData.get('notify_maintenance') === 'on'
    };
    
    fetch('/api/settings/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save notification settings');
        return response.json();
    })
    .then(data => {
        showNotification('Notification settings saved successfully');
    })
    .catch(error => {
        console.error('Error saving notification settings:', error);
        showNotification('Failed to save notification settings', 'error');
    });
}
  

// Room Management Functions
function setupRoomManagement() {
    // DOM Elements
    const roomTableBody = document.getElementById('room-table-body');
    const roomModal = document.getElementById('room-modal');
    const roomDetailsModal = document.getElementById('room-details-modal');
    const roomForm = document.getElementById('room-form');
    const newRoomBtn = document.getElementById('new-room-btn');
    const cancelRoomBtn = document.getElementById('cancel-room');
    const closeRoomDetailsBtn = document.getElementById('close-room-details');
    const roomFilter = document.getElementById('room-filter');
    const roomTypeSelect = document.getElementById('room-type');
    
    // Only proceed if room management elements exist
    if (!roomTableBody) return;
    
    // Event Listeners
    newRoomBtn.addEventListener('click', openRoomModal);
    cancelRoomBtn.addEventListener('click', closeRoomModal);
    closeRoomDetailsBtn.addEventListener('click', closeRoomDetailsModal);
    roomForm.addEventListener('submit', handleRoomFormSubmit);
    roomFilter.addEventListener('change', filterRooms);
    
    // Load initial rooms and room types
    loadRoomTypes().then(() => loadRooms(roomFilter.value));  // Explicitly use current filter value so that it shows list of rooms 
    
    function loadRoomTypes() {
        return fetch('/api/room-types')
            .then(response => response.json())
            .then(roomTypes => {
                // Populate room type dropdown
                roomTypeSelect.innerHTML = '<option value="">Select Room Type</option>';
                roomTypes.forEach(rt => {
                    const option = document.createElement('option');
                    option.value = rt.id;
                    option.textContent = `${rt.name} ($${rt.base_price}/night)`;
                    roomTypeSelect.appendChild(option);
                });
                return roomTypes;
            })
            .catch(error => {
                console.error('Error loading room types:', error);
                showNotification('Failed to load room types', 'error');
            });
    }
    
    function loadRooms(status = 'all') {
        let url = '/api/rooms';
        if (status !== 'all') {
            url += `?status=${status}`;
        }
        
        fetch(url)
            .then(response => response.json())
            .then(rooms => {
                renderRoomTable(rooms);
            })
            .catch(error => {
                console.error('Error loading rooms:', error);
                showNotification('Failed to load rooms', 'error');
            });
    }
    function editRoom(roomId) {
        fetch(`/api/rooms/${roomId}`)
            .then(response => {
                if (!response.ok) throw new Error("Room not found (HTTP " + response.status + ")");
                return response.json();
            })
            .then(room => {
                const roomTypeSelect = document.getElementById('room-type');
            
                // Fill the edit form with room data
                document.getElementById('room-id').value = room.id;
                document.getElementById('room-number').value = room.room_number;  // New
                roomTypeSelect.value = room.room_type_id;
                document.getElementById('room-status').value = room.status;  // New
                document.getElementById('room-notes').value = room.notes || ""; // Handle null notes
                
                // Disable the room type dropdown
            roomTypeSelect.disabled = true;

                // Show the modal
                document.getElementById('room-modal').style.display = 'block';
            })
            .catch(error => {
                console.error("Edit room error:", error);
                showNotification("Failed to load room: " + error.message, "error");
            });
    }

    function renderRoomTable(rooms) {
        roomTableBody.innerHTML = '';
        
        if (rooms.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6">No rooms found</td>';
            roomTableBody.appendChild(row);
            return;
        }
        
        rooms.forEach(room => {
            const row = document.createElement('tr');
            
            // Format last maintenance date
            const lastMaintenance = room.last_maintenance ? new Date(room.last_maintenance).toLocaleDateString() : 'N/A';
            
            row.innerHTML = `
                <td>${room.room_number}</td>
                <td>${room.room_type_name}</td>
                <td><span class="status ${room.status}">${room.status.charAt(0).toUpperCase() + room.status.slice(1)}</span></td>
                <td>$${room.base_price}/night</td>
                <td>${lastMaintenance}</td>
                <td>
                    <button class="btn-action view-room" data-id="${room.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit-room" data-id="${room.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete-room" data-id="${room.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            roomTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
      // Replace the individual button listeners with this event delegation approach:
roomTableBody.addEventListener('click', function(e) {
    const target = e.target.closest('.view-room, .edit-room, .delete-room');
    if (!target) return;
    
    const roomId = target.getAttribute('data-id');
    
    if (target.classList.contains('view-room')) {
        viewRoomDetails(roomId);
    } else if (target.classList.contains('edit-room')) {
        editRoom(roomId);
    } else if (target.classList.contains('delete-room')) {
        deleteRoom(roomId);
    }
});
    }

    function openRoomModal() {
        const roomTypeSelect = document.getElementById('room-type');
        
        document.getElementById('room-modal-title').textContent = 'New Room';
        document.getElementById('room-id').value = '';
        roomForm.reset();
        
        // Enable the room type dropdown for new rooms
        roomTypeSelect.disabled = false;
        
        roomModal.style.display = 'block';
    }
    
    function closeRoomModal() {
        roomModal.style.display = 'none';
    }
    
    function closeRoomDetailsModal() {
        roomDetailsModal.style.display = 'none';
    }
    
    function viewRoomDetails(roomId) {
        fetch(`/api/rooms/${roomId}`)
            .then(response => response.json())
            .then(room => {
                // Populate room details
                document.getElementById('room-details-number').textContent = `Room ${room.room_number}`;
                document.getElementById('room-details-type').textContent = room.room_type_name;
                document.getElementById('room-details-rate').textContent = `$${room.base_price}/night`;
                document.getElementById('room-details-status').textContent = room.status.charAt(0).toUpperCase() + room.status.slice(1);
                document.getElementById('room-details-notes').textContent = room.notes || 'No notes';
                
                // Format dates
                if (room.updated_at) {
                    const updatedDate = new Date(room.updated_at);
                    document.getElementById('room-details-updated').textContent = 
                        updatedDate.toLocaleDateString() + ' at ' + updatedDate.toLocaleTimeString();
                } else {
                    document.getElementById('room-details-updated').textContent = 'N/A';
                }
                
                // Set status badge
                const statusBadge = document.getElementById('room-status-badge');
                statusBadge.textContent = room.status.charAt(0).toUpperCase() + room.status.slice(1);
                statusBadge.className = 'status ' + room.status;
                
                // Populate current reservation
                const reservationsBody = document.getElementById('room-reservations-body');
                reservationsBody.innerHTML = '';
                
                if (room.reservation_id) {
                    fetch(`/api/reservations/${room.reservation_id}`)
                        .then(response => response.json())
                        .then(reservation => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${reservation.guest_name}</td>
                                <td>${reservation.check_in_date}</td>
                                <td>${reservation.check_out_date}</td>
                                <td><span class="status ${reservation.status.toLowerCase()}">${reservation.status}</span></td>
                            `;
                            reservationsBody.appendChild(row);
                        })
                        .catch(() => {
                            const row = document.createElement('tr');
                            row.innerHTML = '<td colspan="4">Error loading reservation</td>';
                            reservationsBody.appendChild(row);
                        });
                } else {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="4">No current reservation</td>';
                    reservationsBody.appendChild(row);
                }
                
                // Populate maintenance history (simplified example)
                const maintenanceBody = document.getElementById('room-maintenance-body');
                maintenanceBody.innerHTML = '';
                
                // In a real app, you would fetch this from an API endpoint
                const maintenanceHistory = [
                    { date: '2023-01-15', description: 'Routine cleaning', staff: 'Housekeeping' },
                    { date: '2022-12-01', description: 'TV replacement', staff: 'Maintenance' }
                ];
                
                if (maintenanceHistory.length > 0) {
                    maintenanceHistory.forEach(item => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${item.date}</td>
                            <td>${item.description}</td>
                            <td>${item.staff}</td>
                        `;
                        maintenanceBody.appendChild(row);
                    });
                } else {
                    const row = document.createElement('tr');
                    row.innerHTML = '<td colspan="3">No maintenance history</td>';
                    maintenanceBody.appendChild(row);
                }
                
                // Show modal
                roomDetailsModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error loading room details:', error);
                showNotification('Failed to load room details', 'error');
            });
    }
    
    function editRoomType(roomTypeId) {
    fetch(`/api/room-types/${roomTypeId}`)
        .then(response => response.json())
        .then(roomType => {
            document.getElementById('room-type-modal-title').textContent = 'Edit Room Type';
            document.getElementById('room-type-id').value = roomType.id;
            document.getElementById('room-type-name').value = roomType.name;
            document.getElementById('room-type-price').value = roomType.base_price;
            document.getElementById('room-type-description').value = roomType.description || '';
            
            // Check amenities checkboxes
            if (roomType.amenities && roomType.amenities.length) {
                document.querySelectorAll('#amenities-container input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = roomType.amenities.includes(checkbox.value);
                });
            }
            
            // Show the modal
            document.getElementById('room-type-modal').style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading room type for edit:', error);
            showNotification('Failed to load room type for editing', 'error');
        });
}
    
    function handleRoomFormSubmit(e) {
        e.preventDefault();
        
        const roomId = document.getElementById('room-id').value;
        const roomTypeSelect = document.getElementById('room-type');

            // Temporarily enable the field to get its value
        const wasDisabled = roomTypeSelect.disabled;
        if (wasDisabled) {
             roomTypeSelect.disabled = false;
    }

        const formData = new FormData(roomForm);
        const roomData = {
        room_number: formData.get('room-number'),  // Changed
        room_type_id: formData.get('room-type'),  // Changed
        status: formData.get('room-status'),  // Changed
        notes: formData.get('room-notes')
     };

     // Restore disabled state
    if (wasDisabled) {
        roomTypeSelect.disabled = true;
    }
        
        const method = roomId ? 'PUT' : 'POST';
        const url = roomId ? `/api/rooms/${roomId}` : '/api/rooms';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(roomData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Failed to save room');
                });
            }
            return response.json();
        })
        .then(data => {
            closeRoomModal();
            loadRooms(roomFilter.value);
            showNotification(roomId ? 'Room updated successfully' : 'Room created successfully');
        })
        .catch(error => {
            console.error('Error saving room:', error);
            showNotification(error.message, 'error');
        });
    }
    
    function deleteRoom(roomId) {
        if (confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
            fetch(`/api/rooms/${roomId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || 'Failed to delete room');
                    });
                }
                return response.json();
            })
            .then(data => {
                loadRooms(roomFilter.value);
                showNotification('Room deleted successfully');
            })
            .catch(error => {
                console.error('Error deleting room:', error);
                showNotification(error.message, 'error');
            });
        }
    }
    
    function filterRooms() {
        loadRooms(roomFilter.value);
    }
}

// Update the init function to include room management setup
function init() {
    setupNavigation();
    renderAvailabilityChart();
    setupReservationModal();
    populateReservationsTable();
    setupDateValidation();
    setupGuestManagement();
    setupRoomManagement(); // Add this line
    setupServiceManagement(); // Add this line
    setupBillingManagement(); // Add this line
    setupReports();
    setupSettings();

}
    // Initialize the app
    init();
});

