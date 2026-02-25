const API_URL = 'https://job-listing-website-qxzu.onrender.com/api/jobs';

// --- DOM Elements ---
const jobListingsContainer = document.getElementById('jobListings');
const loadingIndicator = document.getElementById('loadingIndicator');
const emptyState = document.getElementById('emptyState');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const filterForm = document.getElementById('filterForm');

// Inputs
const titleInput = document.getElementById('title');
const locationInput = document.getElementById('location');
const categoryInput = document.getElementById('category');
const experienceInput = document.getElementById('experience');

// Modal Elements
const jobModal = document.getElementById('jobModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalCompany = document.getElementById('modalCompany');
const modalLocation = document.getElementById('modalLocation');
const modalCategory = document.getElementById('modalCategory');
const modalExperience = document.getElementById('modalExperience');
const modalSalary = document.getElementById('modalSalary');
const modalDescription = document.getElementById('modalDescription');

// Global state to store fetched jobs
let currentJobs = [];

// --- Event Listeners ---

// Fetch options and jobs on initial load
document.addEventListener('DOMContentLoaded', () => {
    fetchLocations();
    fetchJobs();
});

// Filter button clicks (conditional, as it might be removed in the new UI)
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', fetchJobs);
}

// Ensure the clear filters acts correctly
if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
        filterForm.reset();
        fetchJobs();
    });
}

// Live search as user types inside the title input
titleInput.addEventListener('input', () => {
    fetchJobs();
});

// Trigger search automatically when dropdowns change
[locationInput, categoryInput, experienceInput].forEach(select => {
    select.addEventListener('change', fetchJobs);
});

// --- Main Functions ---

/**
 * Fetches unique locations from the FastAPI backend and populates the dropdown.
 */
async function fetchLocations() {
    try {
        const response = await fetch(`${API_URL.replace('/jobs', '/locations')}`);
        if (response.ok) {
            const locations = await response.json();
            const locationSelect = document.getElementById('location');
            locationSelect.innerHTML = '<option value="">All Locations</option>';
            locations.forEach(loc => {
                const opt = document.createElement('option');
                opt.value = loc;
                opt.textContent = loc;
                locationSelect.appendChild(opt);
            });

            // Restore location if it is in the URL to preserve link sharing
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('location')) {
                locationSelect.value = urlParams.get('location');
            }
        }
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

/**
 * Fetches jobs from the FastAPI backend based on current filter values.
 */
async function fetchJobs() {
    // Show loading state, hide other sections
    jobListingsContainer.innerHTML = '';
    loadingIndicator.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Build URL query parameters
    const params = new URLSearchParams();
    if (titleInput.value.trim()) params.append('title', titleInput.value.trim());
    if (locationInput.value.trim()) params.append('location', locationInput.value.trim());
    if (categoryInput.value) params.append('category', categoryInput.value);
    if (experienceInput.value) params.append('experience', experienceInput.value);

    // Update the browser URL without reloading (History API)
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    const targetUrl = `${API_URL}?${params.toString()}`;

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const jobs = await response.json();

        currentJobs = jobs; // Save to global state for modal access
        renderJobs(jobs);

    } catch (error) {
        console.error('Error fetching jobs:', error);
        // Display empty state or error state gracefully
        renderJobs([]);
    }
}

/**
 * Renders the job cards to the DOM using the new Tailwind layout design.
 * @param {Array} jobs - List of job objects.
 */
function renderJobs(jobs) {
    loadingIndicator.classList.add('hidden');
    jobListingsContainer.innerHTML = '';

    if (!jobs || jobs.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    jobs.forEach((job, index) => {
        // --- THE FIX: Ensure every job has a safe string ID for the modal ---
        const safeId = String(job.id || `job-tmp-${index}`);
        job.id = safeId; // Save it back to the object so the modal can find it
        
        const card = document.createElement('div');
        // AI Startup Premium Custom Glass card style - dynamically dark/light
        card.className = "job-card pt-6 px-6 pb-5 rounded-3xl flex flex-col justify-between h-full animate-fade-in-up border border-slate-200 dark:border-white/5 relative overflow-hidden bg-white dark:bg-[#0f172a] shadow-sm";

        const letter = job.company ? job.company.charAt(0).toUpperCase() : 'A';
        // AI Gradients
        const gradients = [
            'from-cyan-400 to-indigo-500',
            'from-purple-500 to-rose-400',
            'from-emerald-400 to-cyan-500',
            'from-blue-500 to-purple-600'
        ];
        
        // Use our index for the color rotation
        const colorIndex = index % gradients.length;
        const selectedGradient = gradients[colorIndex];

        card.innerHTML = `
            <div class="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-bl-full blur-[40px] -z-10 pointer-events-none transition-all duration-300 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10"></div>
            <div class="z-10 bg-transparent flex flex-col h-full">
                <div class="flex justify-between items-center mb-5">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedGradient} flex items-center justify-center text-white font-black text-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)]">${letter}</div>
                    <span class="text-[11px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">${job.location}</span>
                </div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-1 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors cursor-pointer">${job.title}</h3>
                <p class="text-cyan-600 dark:text-cyan-400 font-medium text-sm mb-5">${job.company}</p>
                
                <div class="flex flex-wrap gap-2 mb-6 mt-auto">
                    <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-lg px-2.5 py-1 tracking-wide uppercase">${job.category}</span>
                    <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-lg px-2.5 py-1 tracking-wide uppercase">${job.experience}</span>
                    ${job.salary ? `<span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-lg px-2.5 py-1 tracking-wide uppercase">${job.salary}</span>` : ''}
                </div>
                <button onclick="openModal('${safeId}')" class="w-full py-3 rounded-2xl bg-transparent border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center justify-center group/btn mt-2">
                    View Details
                    <svg class="w-4 h-4 ml-2 opacity-60 group-hover/btn:opacity-100 translate-x-0 group-hover/btn:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
            </div>
        `;
        jobListingsContainer.appendChild(card);
    });
}

// --- Modal Logic ---

/**
 * Opens the modal and populates it with prolonged job details.
 * Exposed globally so inline onclick handlers can reach it.
 */
window.openModal = function (jobId) {
    const job = currentJobs.find(j => j.id === jobId);
    if (!job) return;

    // Populate Data
    modalTitle.textContent = job.title;
    modalCompany.querySelector('span').textContent = job.company;
    modalLocation.querySelector('span').textContent = job.location;
    modalCategory.textContent = job.category;
    modalExperience.textContent = job.experience;

    // Check and populate Salary field if it exists
    if (job.salary) {
        modalSalary.querySelector('span').textContent = job.salary;
        modalSalary.classList.remove('hidden');
    } else {
        modalSalary.classList.add('hidden');
    }

    modalDescription.textContent = job.details || job.description;

    // Display Modal
    jobModal.classList.remove('hidden');

    // Force browser reflow to ensure the transition works
    void jobModal.offsetWidth;

    jobModal.classList.remove('opacity-0');
    jobModal.classList.add('opacity-100');
    jobModal.classList.add('modal-active');

    // Prevent background scrolling
    document.body.classList.add('modal-open');
}

/**
 * Closes the modal with a smooth fade-out.
 */
function closeModal() {
    jobModal.classList.remove('opacity-100');
    jobModal.classList.add('opacity-0');
    jobModal.classList.remove('modal-active');

    // Wait for the CSS transition to finish before hiding display
    setTimeout(() => {
        jobModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }, 300); // matches duration-300 in HTML
}

// Close events
closeModalBtn.addEventListener('click', closeModal);

jobModal.addEventListener('click', (e) => {
    // Close if clicking the backdrop (outside the modal container)
    if (e.target === jobModal) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !jobModal.classList.contains('hidden')) {
        closeModal();
    }
});

// --- Typewriter Effect ---
const TYPE_WORDS = ["deserve", "love", "dream of", "want"];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typewriterSpan = document.getElementById("typewriter");

function typeEffect() {
    const currentWord = TYPE_WORDS[wordIndex];
    if (isDeleting) {
        typewriterSpan.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typewriterSpan.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
    }

    let typeSpeed = isDeleting ? 40 : 100;

    if (!isDeleting && charIndex === currentWord.length) {
        isDeleting = true;
        typeSpeed = 1500; // Pause at the end before deleting
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % TYPE_WORDS.length;
        typeSpeed = 500; // Pause before typing next word
    }

    setTimeout(typeEffect, typeSpeed);
}

// Initialize typewriter if the span exists
if (typewriterSpan) {
    setTimeout(typeEffect, 1000); // Initial delay before starting
}

// --- Theme Toggle Logic ---
const themeToggleBtn = document.getElementById("themeToggleBtn");

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");

        // Save preference to localStorage
        if (document.documentElement.classList.contains("dark")) {
            localStorage.theme = "dark";
        } else {
            localStorage.theme = "light";
        }
    });
}

// Aggressive Default to Dark Mode
// On first visit (no localStorage), force dark mode. Otherwise respect saved preference.
if (localStorage.theme === "light") {
    document.documentElement.classList.remove("dark");
} else {
    document.documentElement.classList.add("dark");
    // Optionally set localStorage.theme="dark" right away here if you want it explicitly bound
}