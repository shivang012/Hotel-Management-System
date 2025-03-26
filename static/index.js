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
    
    // Initialize the app
    init();
});