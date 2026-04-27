// ============ WORKING HOURS STATUS ============
function updateHoursStatus() {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours + (minutes / 60);

    let isOpen = false;
    let statusText = '';

    // Saturday to Thursday (0-4): Open 9:00 - 22:00
    if (day >= 1 && day <= 5) {
        if (currentTime >= 9 && currentTime < 22) {
            isOpen = true;
            statusText = '✓ الصالون مفتوح الآن | Open Now';
        } else {
            statusText = '✗ الصالون مغلق حالياً | Currently Closed';
        }
    }
    // Friday (5): Open 14:00 - 22:00
    else if (day === 5) {
        if (currentTime >= 14 && currentTime < 22) {
            isOpen = true;
            statusText = '✓ الصالون مفتوح الآن | Open Now';
        } else {
            statusText = '✗ الصالون مغلق حالياً | Currently Closed';
        }
    }
    // Sunday (0): Closed
    else {
        statusText = '✗ الصالون مغلق في يوم الأحد | Closed on Sunday';
    }

    const statusElement = document.getElementById('statusText');
    statusElement.textContent = statusText;
    statusElement.classList.toggle('open', isOpen);
    statusElement.classList.toggle('closed', !isOpen);
}

// Update status when page loads and every minute
document.addEventListener('DOMContentLoaded', () => {
    updateHoursStatus();
    setInterval(updateHoursStatus, 60000); // Update every minute
});

// ============ BOOKING FORM ============
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    const successMessage = document.getElementById('successMessage');
    const bookingsList = document.getElementById('bookingsList');

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Load bookings from localStorage
    loadBookings();

    // Handle form submission
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            service: document.getElementById('service').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            notes: document.getElementById('notes').value,
            bookingId: generateBookingId(),
            bookingDate: new Date().toLocaleString('ar-SA')
        };

        // Save to localStorage
        saveBooking(formData);

        // Show success message
        showSuccessMessage(formData);

        // Reset form
        bookingForm.reset();

        // Reload bookings list
        loadBookings();
    });

    function generateBookingId() {
        return 'HAMZA-' + Date.now();
    }

    function saveBooking(booking) {
        let bookings = JSON.parse(localStorage.getItem('hamzaSalonBookings')) || [];
        bookings.push(booking);
        localStorage.setItem('hamzaSalonBookings', JSON.stringify(bookings));
    }

    function loadBookings() {
        const bookings = JSON.parse(localStorage.getItem('hamzaSalonBookings')) || [];
        const bookingsListDiv = document.getElementById('bookingsList');

        if (bookings.length === 0) {
            bookingsListDiv.innerHTML = '<p style="text-align: center; color: #999;">لا توجد حجوزات حتى الآن</p>';
            return;
        }

        bookingsListDiv.innerHTML = '';
        bookings.forEach(booking => {
            const bookingItem = document.createElement('div');
            bookingItem.className = 'booking-item';
            bookingItem.innerHTML = `
                <p><strong>رقم الحجز:</strong> ${booking.bookingId}</p>
                <p><strong>الاسم:</strong> ${booking.name}</p>
                <p><strong>الهاتف:</strong> ${booking.phone}</p>
                <p><strong>الخدمة:</strong> ${booking.service}</p>
                <p><strong>التاريخ:</strong> ${formatDate(booking.date)}</p>
                <p><strong>الوقت:</strong> ${booking.time}</p>
                ${booking.notes ? `<p><strong>ملاحظات:</strong> ${booking.notes}</p>` : ''}
                <p style="font-size: 0.85rem; color: #999;"><strong>تاريخ الحجز:</strong> ${booking.bookingDate}</p>
                <button class="btn btn-secondary" onclick="deleteBooking('${booking.bookingId}')" style="margin-top: 1rem;">حذف الحجز</button>
            `;
            bookingsListDiv.appendChild(bookingItem);
        });
    }

    function showSuccessMessage(booking) {
        const successDetails = document.getElementById('successDetails');
        successDetails.innerHTML = `
            <strong>شكراً لك!</strong><br>
            تم حجز موعدك بنجاح<br><br>
            
            <p><strong>رقم الحجز:</strong> ${booking.bookingId}</p>
            <p><strong>الاسم:</strong> ${booking.name}</p>
            <p><strong>الخدمة:</strong> ${booking.service}</p>
            <p><strong>التاريخ:</strong> ${formatDate(booking.date)}</p>
            <p><strong>الوقت:</strong> ${booking.time}</p>
            
            <br>سيتم التواصل معك على الرقم ${booking.phone} للتأكيد
        `;

        bookingForm.style.display = 'none';
        successMessage.style.display = 'block';

        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth' });
    }

    function formatDate(dateString) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            locale: 'ar-SA'
        };
        return new Date(dateString + 'T00:00:00').toLocaleDateString('ar-SA', options);
    }

    // Global function to delete booking
    window.deleteBooking = function(bookingId) {
        if (confirm('هل تريد حذف هذا الحجز؟')) {
            let bookings = JSON.parse(localStorage.getItem('hamzaSalonBookings')) || [];
            bookings = bookings.filter(b => b.bookingId !== bookingId);
            localStorage.setItem('hamzaSalonBookings', JSON.stringify(bookings));
            loadBookings();
        }
    };

    // Global function to reload page
    window.location.reloadPage = function() {
        location.reload();
    };
});

// ============ SMOOTH SCROLLING ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============ ANIMATION ON SCROLL ============
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.service-card, .hours-card, .contact-item').forEach(el => {
        observer.observe(el);
    });
});
