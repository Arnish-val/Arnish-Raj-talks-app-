// Application State
let releases = [];
let filteredReleases = [];
let activeFilters = {
    search: '',
    types: ['Feature', 'Changed', 'Resolved', 'Deprecated', 'General']
};
let selectedUpdateForTweet = null;

// Progress Ring Circumference Calculations
const circle = document.querySelector('.progress-ring__circle');
const radius = circle ? circle.r.baseVal.value : 11;
const circumference = radius * 2 * Math.PI;

if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}

// DOM Elements
const refreshBtn = document.getElementById('refresh-button');
const searchInput = document.getElementById('search-input');
const typeFiltersContainer = document.getElementById('type-filters');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const errorRetryBtn = document.getElementById('error-retry-btn');
const emptyState = document.getElementById('empty-state');
const feedGrid = document.getElementById('feed-grid');

const totalDaysEl = document.getElementById('total-days');
const totalItemsEl = document.getElementById('total-items');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const progressRingCircle = document.querySelector('.progress-ring__circle');
const tweetUrlPreview = document.getElementById('tweet-url-preview');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');

// Floating Tweet Selection Elements
const floatingTweetBtn = document.getElementById('floating-tweet-button');
let lastSelectedText = '';
let lastSelectedLink = '';
let lastSelectedDate = '';

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh feed
    refreshBtn.addEventListener('click', () => fetchReleases(true));
    errorRetryBtn.addEventListener('click', () => fetchReleases(true));
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value.toLowerCase().trim();
        applyFilters();
    });
    
    // Type Filter Checkboxes
    typeFiltersContainer.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT') {
            const checkedTypes = Array.from(typeFiltersContainer.querySelectorAll('input:checked'))
                                      .map(cb => cb.value);
            activeFilters.types = checkedTypes;
            applyFilters();
        }
    });
    
    // Tweet Composer Character Count
    tweetTextarea.addEventListener('input', updateCharCount);
    
    // Modal Close actions
    closeModalBtn.addEventListener('click', hideTweetModal);
    cancelTweetBtn.addEventListener('click', hideTweetModal);
    
    // Post to X action
    postTweetBtn.addEventListener('click', postToTwitter);
    
    // Text Selection for Floating Tweet button
    document.addEventListener('mouseup', handleTextSelection);
    floatingTweetBtn.addEventListener('mousedown', handleFloatingTweetClick);
    
    // Close modal on background click
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            hideTweetModal();
        }
    });
}

// Fetch Releases from Flask API
async function fetchReleases(refresh = false) {
    showLoading();
    if (refresh) {
        refreshBtn.classList.add('loading');
    }
    
    try {
        const response = await fetch(`/api/releases?refresh=${refresh}`);
        const data = await response.json();
        
        if (data.success) {
            releases = data.releases;
            calculateStats();
            applyFilters();
            showToast(refresh ? 'Release notes successfully refreshed!' : 'Release notes loaded.');
        } else {
            showError(data.error || 'Failed to fetch release notes.');
        }
    } catch (err) {
        showError('Network error. Failed to connect to server.');
    } finally {
        refreshBtn.classList.remove('loading');
    }
}

// Stats Calculation
function calculateStats() {
    const counts = {
        Feature: 0,
        Changed: 0,
        Resolved: 0,
        Deprecated: 0,
        General: 0
    };
    
    let totalItems = 0;
    
    releases.forEach(release => {
        release.updates.forEach(up => {
            const t = counts[up.type] !== undefined ? up.type : 'General';
            counts[t]++;
            totalItems++;
        });
    });
    
    // Update Badge Counts in Sidebar
    document.getElementById('count-feature').textContent = counts.Feature;
    document.getElementById('count-changed').textContent = counts.Changed;
    document.getElementById('count-resolved').textContent = counts.Resolved;
    document.getElementById('count-deprecated').textContent = counts.Deprecated;
    document.getElementById('count-general').textContent = counts.General;
    
    totalDaysEl.textContent = releases.length;
    totalItemsEl.textContent = totalItems;
}

// Apply Search & Tag Filters
function applyFilters() {
    filteredReleases = [];
    
    releases.forEach(release => {
        const matchingUpdates = release.updates.filter(update => {
            const matchesType = activeFilters.types.includes(update.type);
            
            // Matches search key
            const matchesSearch = !activeFilters.search || 
                update.text.toLowerCase().includes(activeFilters.search) ||
                update.type.toLowerCase().includes(activeFilters.search) ||
                release.title.toLowerCase().includes(activeFilters.search);
                
            return matchesType && matchesSearch;
        });
        
        if (matchingUpdates.length > 0) {
            // Keep the release metadata but only with matching sub-updates
            filteredReleases.push({
                ...release,
                updates: matchingUpdates
            });
        }
    });
    
    renderReleases();
}

// Render Release Cards to DOM
function renderReleases() {
    feedGrid.innerHTML = '';
    
    if (filteredReleases.length === 0) {
        showEmpty();
        return;
    }
    
    showGrid();
    
    filteredReleases.forEach(release => {
        const card = document.createElement('article');
        card.className = 'release-card';
        
        // Header
        const header = document.createElement('div');
        header.className = 'card-header';
        
        const titleGroup = document.createElement('div');
        titleGroup.className = 'card-title-group';
        titleGroup.innerHTML = `
            <span class="card-title">${release.title}</span>
        `;
        
        const link = document.createElement('a');
        link.className = 'card-link';
        link.href = release.link;
        link.target = '_blank';
        link.title = 'View official BigQuery docs';
        link.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
            </svg>
        `;
        
        header.appendChild(titleGroup);
        header.appendChild(link);
        card.appendChild(header);
        
        // Updates List
        const updatesList = document.createElement('div');
        updatesList.className = 'updates-list';
        
        release.updates.forEach(update => {
            const item = document.createElement('div');
            item.className = 'update-item';
            
            // Get badge color class
            const badgeType = update.type.toLowerCase();
            const badgeClass = `badge-${badgeType}`;
            
            item.innerHTML = `
                <span class="update-type-badge ${badgeClass}">${update.type}</span>
                <div class="update-body">${update.html}</div>
                <div class="update-actions">
                    <button class="tweet-action-btn" title="Tweet this update">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </button>
                </div>
            `;
            
            // Add click listener for Tweet button
            const tweetBtn = item.querySelector('.tweet-action-btn');
            tweetBtn.addEventListener('click', () => {
                showTweetComposer(update, release);
            });
            
            updatesList.appendChild(item);
        });
        
        card.appendChild(updatesList);
        feedGrid.appendChild(card);
    });
}

// Show Tweet Composer Modal
function showTweetComposer(update, release) {
    selectedUpdateForTweet = {
        update: update,
        release: release
    };
    
    // Twitter has a hard limit of 280 chars. 
    // We should prefill text nicely.
    const dateText = release.title;
    const typeText = update.type.toUpperCase();
    const updateText = update.text;
    const url = release.link || 'https://cloud.google.com/bigquery';
    
    // We want the tweet to look like:
    // BQ [Date] #BigQuery: [TYPE] - [Short Text...] [Link]
    // A URL counts as 23 characters on X. Hashtags + formatting counts as approx 30 chars.
    // So we can let the updateText be up to ~220 characters.
    const urlCost = 23;
    const prefix = `BigQuery Release [${dateText}] - ${typeText}: `;
    const hashtags = `\n\n#GoogleCloud #BigQuery`;
    
    const maxTextLength = 280 - prefix.length - urlCost - hashtags.length - 2; // extra safety
    
    let cleanText = updateText
        .replace(/\s+/g, ' ') // normalize spaces
        .trim();
        
    if (cleanText.length > maxTextLength) {
        cleanText = cleanText.substring(0, maxTextLength - 3) + '...';
    }
    
    const draftText = `${prefix}${cleanText}${hashtags}`;
    
    tweetTextarea.value = draftText;
    tweetUrlPreview.textContent = url;
    
    updateCharCount();
    tweetModal.classList.remove('hidden');
    tweetTextarea.focus();
}

// Hide Modal
function hideTweetModal() {
    tweetModal.classList.add('hidden');
    selectedUpdateForTweet = null;
}

// Update Character Count progress ring
function updateCharCount() {
    const currentLength = tweetTextarea.value.length;
    const limit = 280;
    const remaining = limit - currentLength;
    
    charCounter.textContent = remaining;
    
    if (remaining < 0) {
        charCounter.style.color = '#ef4444';
        postTweetBtn.disabled = true;
    } else {
        charCounter.style.color = 'var(--text-muted)';
        postTweetBtn.disabled = false;
    }
    
    // Progress Ring offset
    if (progressRingCircle) {
        const percent = Math.min(100, (currentLength / limit) * 100);
        const offset = circumference - (percent / 100) * circumference;
        progressRingCircle.style.strokeDashoffset = offset;
        
        // Change color based on remaining space
        if (remaining <= 20) {
            progressRingCircle.style.stroke = '#f59e0b'; // warning orange
        } else if (remaining < 0) {
            progressRingCircle.style.stroke = '#ef4444'; // critical red
        } else {
            progressRingCircle.style.stroke = 'var(--color-primary)';
        }
    }
}

// Open Twitter Web Intent
function postToTwitter() {
    const tweetText = tweetTextarea.value;
    const url = selectedUpdateForTweet ? selectedUpdateForTweet.release.link : (lastSelectedLink || 'https://cloud.google.com/bigquery');
    
    // Create Twitter/X Intent URL
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
    
    window.open(intentUrl, '_blank');
    hideTweetModal();
    showToast('Redirected to Twitter/X to post!');
}

// Handle Custom Text Selection for Tweet Selection feature
function handleTextSelection(e) {
    // Small delay to allow selection object to update
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // If selection is inside an update, try to associate its link/metadata
        if (selectedText.length > 5 && selectedText.length <= 250) {
            // Find parent release card and item
            const range = selection.getRangeAt(0);
            const containerNode = range.commonAncestorContainer.nodeType === 3 
                ? range.commonAncestorContainer.parentNode 
                : range.commonAncestorContainer;
            
            const updateItem = containerNode.closest('.update-item');
            const releaseCard = containerNode.closest('.release-card');
            
            if (updateItem && releaseCard) {
                const cardLink = releaseCard.querySelector('.card-link');
                lastSelectedLink = cardLink ? cardLink.href : 'https://cloud.google.com/bigquery';
                
                const cardTitle = releaseCard.querySelector('.card-title');
                lastSelectedDate = cardTitle ? cardTitle.textContent : '';
                
                const badge = updateItem.querySelector('.update-type-badge');
                const typeText = badge ? badge.textContent : 'UPDATE';
                
                lastSelectedText = selectedText;
                
                // Position floating button
                const rect = range.getBoundingClientRect();
                
                floatingTweetBtn.style.top = `${rect.top + window.scrollY - 40}px`;
                floatingTweetBtn.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 60}px`;
                floatingTweetBtn.classList.remove('hidden');
                return;
            }
        }
        
        // Hide button if selection is empty or invalid
        floatingTweetBtn.classList.add('hidden');
    }, 10);
}

// Handle Click on Floating Tweet Selection button
function handleFloatingTweetClick(e) {
    e.preventDefault(); // prevent selection clearing
    
    selectedUpdateForTweet = null; // custom selection mode
    
    const dateText = lastSelectedDate;
    const tweetTextSnippet = lastSelectedText;
    const url = lastSelectedLink;
    
    const prefix = `BigQuery Release [${dateText}]: "`;
    const suffix = `"\n\n#GoogleCloud #BigQuery`;
    const urlCost = 23;
    
    const maxTextLength = 280 - prefix.length - suffix.length - urlCost - 2;
    
    let cleanText = tweetTextSnippet.replace(/\s+/g, ' ').trim();
    if (cleanText.length > maxTextLength) {
        cleanText = cleanText.substring(0, maxTextLength - 3) + '...';
    }
    
    const draftText = `${prefix}${cleanText}${suffix}`;
    
    tweetTextarea.value = draftText;
    tweetUrlPreview.textContent = url;
    
    updateCharCount();
    tweetModal.classList.remove('hidden');
    tweetTextarea.focus();
    
    // Clear browser selection
    window.getSelection().removeAllRanges();
    floatingTweetBtn.classList.add('hidden');
}

// UI State Switchers
function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
    feedGrid.classList.add('hidden');
}

function showError(msg) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorMessage.textContent = msg;
    emptyState.classList.add('hidden');
    feedGrid.classList.add('hidden');
}

function showEmpty() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    feedGrid.classList.add('hidden');
}

function showGrid() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
    feedGrid.classList.remove('hidden');
}

// Simple Toast Notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
        </svg>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after animation completes
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
