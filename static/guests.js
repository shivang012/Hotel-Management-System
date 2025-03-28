document.addEventListener('DOMContentLoaded', function() {
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
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.close');
    
    // Initialize
    loadGuests();
    
    // Event Listeners
    newGuestBtn.addEventListener('click', openGuestModal);
    cancelGuestBtn.addEventListener('click', closeGuestModal);
    closeGuestDetailsBtn.addEventListener('click', closeGuestDetailsModal);
    guestForm.addEventListener('submit', handleGuestFormSubmit);
    searchGuestsBtn.addEventListener('click', searchGuests);
    guestSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchGuests();
    });
    guestFilter.addEventListener('change', filterGuests);
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            guestModal.style.display = 'none';
            guestDetailsModal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === guestModal) {
            guestModal.style.display = 'none';
        }
        if (event.target === guestDetailsModal) {
            guestDetailsModal.style.display = 'none';
        }
    });
    
    // Functions
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
                    // Assuming VIP status is stored in guest.notes or similar
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
    
    function showNotification(message, type = 'success') {
        // Reuse the notification function from index.js or implement a similar one
        console.log(`${type}: ${message}`);
        // In a real implementation, you would show a visual notification
    }
});