// Store offer data globally
let currentOffer = null;

// Skokie addresses for autocomplete
const skokieAddresses = [
    // Oakton Street
    "8234 Oakton St, Skokie, IL 60076",
    "4812 Oakton St, Skokie, IL 60076",
    "5432 Oakton St, Skokie, IL 60076",
    // Dempster Street
    "3456 Dempster St, Skokie, IL 60076",
    "7890 Dempster St, Skokie, IL 60076",
    // Church Street
    "5234 Church St, Skokie, IL 60076",
    "8901 Church St, Skokie, IL 60076",
    // Lincoln Avenue
    "8901 Lincoln Ave, Skokie, IL 60076",
    "7234 Lincoln Ave, Skokie, IL 60076",
    // Main Street
    "4567 Main St, Skokie, IL 60076",
    "8123 Main St, Skokie, IL 60076",
    // Crawford Avenue
    "9123 Crawford Ave, Skokie, IL 60076",
    "5678 Crawford Ave, Skokie, IL 60076",
    // Gross Point Road
    "9015 Gross Point Rd, Skokie, IL 60076",
    "7654 Gross Point Rd, Skokie, IL 60076",
    // Niles Center Road
    "7623 Niles Center Rd, Skokie, IL 60076",
    "8456 Niles Center Rd, Skokie, IL 60076",
    // Kostner Avenue
    "7890 Kostner Ave, Skokie, IL 60076",
    "9234 Kostner Ave, Skokie, IL 60076",
    // Kedzie Avenue
    "5678 Kedzie Ave, Skokie, IL 60076",
    "8901 Kedzie Ave, Skokie, IL 60076",
    // Ridge Avenue
    "8765 Ridge Ave, Skokie, IL 60076",
    "7123 Ridge Ave, Skokie, IL 60076",
    // Tripp Avenue
    "4321 Tripp Ave, Skokie, IL 60076",
    "6789 Tripp Ave, Skokie, IL 60076",
    // Howard Street
    "6543 Howard St, Skokie, IL 60076",
    "8234 Howard St, Skokie, IL 60076",
    // Touhy Avenue
    "9876 Touhy Ave, Skokie, IL 60076",
    "5432 Touhy Ave, Skokie, IL 60076",
    // McCormick Boulevard
    "2345 McCormick Blvd, Skokie, IL 60076",
    "7890 McCormick Blvd, Skokie, IL 60076",
    // Niles Avenue
    "8123 Niles Ave, Skokie, IL 60076",
    "5678 Niles Ave, Skokie, IL 60076",
    // Central Park Avenue
    "3210 Central Park Ave, Skokie, IL 60076",
    "9876 Central Park Ave, Skokie, IL 60076"
];

/**
 * Custom Autocomplete Implementation
 * Better UX than basic HTML datalist
 */
function initCustomAutocomplete() {
    const input = document.getElementById('address');
    const autocompleteList = document.getElementById('autocomplete-list');
    let currentFocus = -1;

    // Show autocomplete on input
    input.addEventListener('input', function() {
        const value = this.value;
        closeAllLists();

        if (!value) return;

        currentFocus = -1;

        // Filter addresses that match input
        const matches = skokieAddresses.filter(address =>
            address.toLowerCase().includes(value.toLowerCase())
        );

        if (matches.length === 0) return;

        // Show max 8 suggestions
        matches.slice(0, 8).forEach(address => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';

            // Highlight matching text
            const matchIndex = address.toLowerCase().indexOf(value.toLowerCase());
            const beforeMatch = address.substring(0, matchIndex);
            const match = address.substring(matchIndex, matchIndex + value.length);
            const afterMatch = address.substring(matchIndex + value.length);

            item.innerHTML = beforeMatch + '<strong>' + match + '</strong>' + afterMatch;

            // Click handler
            item.addEventListener('click', function() {
                input.value = address;
                closeAllLists();
            });

            autocompleteList.appendChild(item);
        });

        autocompleteList.style.display = 'block';
    });

    // Keyboard navigation
    input.addEventListener('keydown', function(e) {
        const items = autocompleteList.getElementsByClassName('autocomplete-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') {
            if (currentFocus > -1 && items[currentFocus]) {
                e.preventDefault();
                items[currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            closeAllLists();
        }
    });

    function addActive(items) {
        if (!items) return;
        removeActive(items);

        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;

        items[currentFocus].classList.add('autocomplete-active');
    }

    function removeActive(items) {
        for (let item of items) {
            item.classList.remove('autocomplete-active');
        }
    }

    function closeAllLists() {
        autocompleteList.style.display = 'none';
        autocompleteList.innerHTML = '';
    }

    // Close on click outside
    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            closeAllLists();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize custom autocomplete
    initCustomAutocomplete();
    const leadForm = document.getElementById('leadForm');
    const submitBtn = leadForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    const offerContactForm = document.getElementById('offerContactForm');

    // Step 1: Initial form submission - Get cash offer
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get address value
        const address = document.getElementById('address').value.trim();

        // Basic validation
        if (!address) {
            alert('Please enter a property address.');
            return;
        }

        // Disable submit button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Calculating Offer...';

        try {
            // Get cash offer from backend
            const response = await fetch('/api/get-offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address })
            });

            const data = await response.json();

            if (data.success) {
                // Store offer data
                currentOffer = data;

                // Display the offer modal
                showOfferModal(data);

                // Clear the address field (optional)
                // leadForm.reset();
            } else {
                // Error from server
                alert(data.error || 'Unable to generate offer. Please check the address and try again.');
            }
        } catch (error) {
            console.error('Error getting offer:', error);
            alert('Failed to get offer. Please check your connection and try again.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    // Step 2: Contact form in modal - Submit lead with offer data
    offerContactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('offerEmail').value.trim();
        const phone = document.getElementById('offerPhone').value.trim();

        if (!email || !phone) {
            alert('Please fill in all fields.');
            return;
        }

        if (!currentOffer) {
            alert('Offer data not found. Please try again.');
            closeOfferModal();
            return;
        }

        const submitButton = offerContactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            // Submit lead with offer data
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: currentOffer.address,
                    email,
                    phone,
                    estimate: currentOffer.estimate,
                    cashOffer: currentOffer.cashOffer,
                    offerPercentage: currentOffer.offerPercentage
                })
            });

            const data = await response.json();

            if (data.success) {
                // Success! Show confirmation
                alert(`Thank you! Your official cash offer of ${formatCurrency(currentOffer.cashOffer)} has been sent to ${email}. One of our specialists will contact you at ${phone} shortly.`);

                // Reset forms and close modal
                leadForm.reset();
                offerContactForm.reset();
                closeOfferModal();
                currentOffer = null;
            } else {
                alert(data.error || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting lead:', error);
            alert('Failed to submit. Please check your connection and try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

// Show offer modal with data
function showOfferModal(offerData) {
    const modal = document.getElementById('offerModal');

    // Populate modal with offer data
    document.getElementById('offerAddress').textContent = offerData.address;
    document.getElementById('offerEstimate').textContent = formatCurrency(offerData.estimate);
    document.getElementById('offerAmount').textContent = formatCurrency(offerData.cashOffer);
    document.getElementById('offerPercentage').textContent = `${offerData.offerPercentage}% of estimated value`;

    // Populate property details if available
    if (offerData.propertyDetails) {
        const details = offerData.propertyDetails;
        document.getElementById('propertyType').textContent = details.propertyType || '-';
        document.getElementById('propertySqft').textContent = details.sqft ? details.sqft.toLocaleString() : '-';
        document.getElementById('propertyBeds').textContent = details.bedrooms || '-';
        document.getElementById('propertyBaths').textContent = details.bathrooms || '-';
        document.getElementById('propertyYear').textContent = details.yearBuilt || '-';
    }

    // Set up Cook County Assessor link
    const assessorSection = document.getElementById('assessorSection');
    const cookCountyLink = document.getElementById('cookCountyLink');

    // Use the Cook County URL from the backend response if available
    if (offerData.marketEstimate && offerData.marketEstimate.url) {
        cookCountyLink.href = offerData.marketEstimate.url;
        assessorSection.style.display = 'block';
    } else {
        // Hide section if no Cook County URL (fallback estimate)
        assessorSection.style.display = 'none';
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close offer modal
function closeOfferModal() {
    const modal = document.getElementById('offerModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('offerModal');
    if (e.target === modal) {
        closeOfferModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeOfferModal();
    }
});

// Format number as currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
