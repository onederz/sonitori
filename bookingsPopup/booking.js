// bookingsPopup/booking.js
(function() {
    // ========== CALENDAR STATE ==========
    let currentDate = new Date();
    let checkInDate = null;
    let checkOutDate = null;
    let selectingFor = 'checkIn'; // 'checkIn' or 'checkOut'
    let scrollPosition = 0;

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const weekdaysShort = ["Su","Mo","Tu","We","Th","Fr","Sa"];

    // DOM elements
    const bookNowNav = document.getElementById('bookNowNav');
    const desktopBookBtn = document.getElementById('desktopBookBtn');
    const mobileFixedBook = document.getElementById('mobileFixedBook');
    const popup = document.getElementById('calendarPopup');
    const overlay = document.getElementById('popupOverlay');
    const closePopupBtn = document.getElementById('closePopupBtn');
    const searchBtn = document.getElementById('searchDatesBtn');
    const calendarContainer = document.getElementById('calendarContainer');
    const nightCountDisplay = document.getElementById('nightsValue');
    const body = document.body;

    // Debug: Log which elements are found
    console.log('Calendar Popup Debug:');
    console.log('- popup:', popup);
    console.log('- overlay:', overlay);
    console.log('- closePopupBtn:', closePopupBtn);
    console.log('- searchBtn:', searchBtn);
    console.log('- calendarContainer:', calendarContainer);
    console.log('- bookNowNav:', bookNowNav);
    console.log('- desktopBookBtn:', desktopBookBtn);
    console.log('- mobileFixedBook:', mobileFixedBook);

    // Check if all required elements exist
    if (!popup || !overlay || !closePopupBtn || !searchBtn || !calendarContainer) {
        console.error('Calendar popup: Required popup elements not found');
        return;
    }

    function disableBodyScroll() {
        scrollPosition = window.pageYOffset;
        body.classList.add('no-scroll');
        body.style.top = `-${scrollPosition}px`;
    }

    function enableBodyScroll() {
        body.classList.remove('no-scroll');
        body.style.top = '';
        window.scrollTo(0, scrollPosition);
    }

    function openPopup(e) {
        console.log('openPopup called', e);
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event bubbling
        
        popup.classList.add('show');
        overlay.classList.add('show');
        disableBodyScroll();
        renderCalendars();
        updateSearchButton();
        updateNightCount();
    }

    function closePopup() {
        popup.classList.remove('show');
        overlay.classList.remove('show');
        enableBodyScroll();
    }

    function calculateNights() {
        if (checkInDate && checkOutDate) {
            const diffTime = checkOutDate - checkInDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }
        return 0;
    }

    function updateNightCount() {
        if (nightCountDisplay) {
            const nights = calculateNights();
            nightCountDisplay.textContent = nights;
        }
    }

    function shouldShowOneCalendar() {
        // Check if screen is mobile size (<= 768px)
        return window.innerWidth <= 768;
    }

    function renderCalendars() {
        if (!calendarContainer) return;
        
        const firstMonth = new Date(currentDate);
        let html = '';
        
        if (shouldShowOneCalendar()) {
            // On mobile, show only one calendar
            html = renderMonthHTML(firstMonth, 0, true);
        } else {
            // On desktop/tablet, show two calendars
            const secondMonth = new Date(currentDate); 
            secondMonth.setMonth(secondMonth.getMonth() + 1);
            html = renderMonthHTML(firstMonth, 0, false) + renderMonthHTML(secondMonth, 1, false);
        }
        
        calendarContainer.innerHTML = html;
        attachDayClickHandlers();
    }

    function renderMonthHTML(date, index, isSingle = false) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let daysHTML = '';
        for (let i = 0; i < firstDay; i++) daysHTML += `<div class="day empty"></div>`;

        for (let d = 1; d <= daysInMonth; d++) {
            const dayDate = new Date(year, month, d);
            dayDate.setHours(0,0,0,0);
            const today = new Date(); 
            today.setHours(0,0,0,0);
            
            // Determine if date should be disabled
            let isDisabled = false;
            
            // Always disable dates before today
            if (dayDate < today) {
                isDisabled = true;
            }
            
            // When selecting checkout, disable dates before or equal to check-in
            if (selectingFor === 'checkOut' && checkInDate) {
                if (dayDate <= checkInDate) {
                    isDisabled = true;
                }
            }
            
            const isCheckIn = checkInDate && checkInDate.getTime() === dayDate.getTime();
            const isCheckOut = checkOutDate && checkOutDate.getTime() === dayDate.getTime();
            const inRange = checkInDate && checkOutDate && dayDate > checkInDate && dayDate < checkOutDate;
            
            let cls = 'day';
            if (isDisabled) cls += ' disabled';
            if (isCheckIn) cls += ' check-in';
            if (isCheckOut) cls += ' check-out';
            if (inRange) cls += ' in-range';
            if (!isDisabled && dayDate.getTime() === today.getTime()) cls += ' today';
            
            let label = '';
            if (isCheckIn) label = '<span class="label">IN</span>';
            if (isCheckOut) label = '<span class="label">OUT</span>';

            daysHTML += `<div class="${cls}" data-year="${year}" data-month="${month}" data-day="${d}">${d}${label}</div>`;
        }
        
        // Navigation buttons logic
        let prevBtn = '';
        let nextBtn = '';
        
        if (isSingle) {
            // For single calendar view, show both prev and next buttons
            const prevDisabled = (month === new Date().getMonth() && year === new Date().getFullYear());
            prevBtn = `<button class="month-nav-btn" id="prevMonthBtn" ${prevDisabled ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
            nextBtn = `<button class="month-nav-btn" id="nextMonthBtn"><i class="fas fa-chevron-right"></i></button>`;
        } else {
            // For dual calendar view
            if (index === 0) {
                const prevDisabled = (month === new Date().getMonth() && year === new Date().getFullYear());
                prevBtn = `<button class="month-nav-btn" id="prevMonthBtn" ${prevDisabled ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
            } else if (index === 1) {
                nextBtn = `<button class="month-nav-btn" id="nextMonthBtn"><i class="fas fa-chevron-right"></i></button>`;
            }
        }

        return `<div class="month-box">
            <div class="month-header">
                <span class="month-year">${monthNames[month]} ${year}</span>
                <div>${prevBtn} ${nextBtn}</div>
            </div>
            <div class="weekdays">${weekdaysShort.map(d=>`<div>${d}</div>`).join('')}</div>
            <div class="days-grid">${daysHTML}</div>
        </div>`;
    }

    function attachDayClickHandlers() {
        document.querySelectorAll('.day:not(.empty):not(.disabled)').forEach(day => {
            day.addEventListener('click', (e) => {
                const year = parseInt(day.dataset.year);
                const month = parseInt(day.dataset.month);
                const dayNum = parseInt(day.dataset.day);
                const selected = new Date(year, month, dayNum);
                selected.setHours(0,0,0,0);

                if (selectingFor === 'checkIn') {
                    checkInDate = selected;
                    checkOutDate = null;
                    selectingFor = 'checkOut';
                } else {
                    // We're selecting check-out
                    if (!checkInDate) { 
                        // This shouldn't happen, but just in case
                        checkInDate = selected; 
                        selectingFor = 'checkOut'; 
                    }
                    else if (selected <= checkInDate) { 
                        alert('Check-out must be after check-in'); 
                        return; 
                    }
                    else { 
                        checkOutDate = selected; 
                        selectingFor = 'checkIn'; // Reset to check-in for next selection
                    }
                }
                updateNightCount();
                renderCalendars();
                updateSearchButton();
            });
        });

        const prevBtn = document.getElementById('prevMonthBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', ()=>{
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendars();
            });
        }
        
        const nextBtn = document.getElementById('nextMonthBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', ()=>{
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendars();
            });
        }
    }

    function updateSearchButton() {
        if (searchBtn) {
            searchBtn.disabled = !(checkInDate && checkOutDate);
        }
    }

    // Function to attach event listeners to all book buttons
    function attachBookButtonListeners() {
        console.log('Attaching book button listeners');
        
        // Try multiple selectors to find the mobile button
        const mobileButtons = [
            document.getElementById('mobileFixedBook'),
            document.querySelector('.mobile-fixed-book'),
            document.querySelector('[id*="mobile"][id*="Book"]'),
            document.querySelector('a[href*="book"], button[class*="book"]')
        ].filter(btn => btn); // Remove null/undefined
        
        console.log('Found mobile buttons:', mobileButtons.length);
        
        // Attach to all found mobile buttons
        mobileButtons.forEach(btn => {
            console.log('Attaching to mobile button:', btn);
            btn.removeEventListener('click', openPopup); // Remove any existing
            btn.addEventListener('click', openPopup);
        });
        
        // Attach to desktop buttons
        if (bookNowNav) {
            bookNowNav.removeEventListener('click', openPopup);
            bookNowNav.addEventListener('click', openPopup);
        }
        
        if (desktopBookBtn) {
            desktopBookBtn.removeEventListener('click', openPopup);
            desktopBookBtn.addEventListener('click', openPopup);
        }
    }

    // Try to attach listeners immediately
    attachBookButtonListeners();

    // Also try after a short delay to ensure DOM is fully loaded
    setTimeout(attachBookButtonListeners, 500);

    // And when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', attachBookButtonListeners);

    // Also try on load event
    window.addEventListener('load', attachBookButtonListeners);

    // Close popup events
    closePopupBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);
    
    searchBtn.addEventListener('click', ()=>{
        if (!checkInDate || !checkOutDate) return;
        
        const baseUrl = 'https://hotels.cloudbeds.com/reservation/v3GB0x#';
        const checkinStr = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth()+1).padStart(2,'0')}-${String(checkInDate.getDate()).padStart(2,'0')}`;
        const checkoutStr = `${checkOutDate.getFullYear()}-${String(checkOutDate.getMonth()+1).padStart(2,'0')}-${String(checkOutDate.getDate()).padStart(2,'0')}`;
        const url = `${baseUrl}checkin=${checkinStr}&checkout=${checkoutStr}`;
        window.open(url, '_blank');
        closePopup();
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopup(); });

    // Handle window resize to switch between single/dual calendar views
    window.addEventListener('resize', () => {
        if (popup.classList.contains('show')) {
            renderCalendars();
        }
    });

    // Initial render (hidden)
    renderCalendars();

    // Debug: Check if popup exists in DOM
    console.log('Popup element in DOM:', document.getElementById('calendarPopup'));
})();