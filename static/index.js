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

    // Initialize the app
    init();
});