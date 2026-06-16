document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const feedContainer = document.getElementById('feed-container');
    const skeleton = document.getElementById('loading-skeleton');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const refreshBtn = document.getElementById('refresh-btn');
    const retryBtn = document.getElementById('retry-btn');
    const updateCount = document.getElementById('update-count');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    
    const noSelectionState = document.getElementById('no-selection-state');
    const composerState = document.getElementById('composer-state');
    const selectedTypeBadge = document.getElementById('selected-type-badge');
    const selectedDate = document.getElementById('selected-date');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const tweetBtn = document.getElementById('tweet-btn');

    let allReleases = [];
    let selectedUpdate = null;

    // Helper: Strip HTML tags to get clean plain text
    function cleanHtmlText(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        // Clean up code blocks and other formatting subtly
        return tempDiv.textContent || tempDiv.innerText || "";
    }

    // Helper: Format Tweet
    function generateTweetDraft(date, type, descriptionHtml, link) {
        const plainText = cleanHtmlText(descriptionHtml).trim();
        const prefix = `BigQuery [${date}] • ${type}\n`;
        const hashtags = `\n\n#BigQuery #GoogleCloud`;
        const urlPart = link ? `\n${link}` : '';
        
        // Calculate max description length
        // Standard Twitter link is counted as 23 characters
        const linkCount = link ? 23 : 0;
        const baseLength = prefix.length + hashtags.length + 1 + linkCount;
        const maxDescLength = 280 - baseLength;
        
        let descText = plainText;
        if (plainText.length > maxDescLength) {
            descText = plainText.substring(0, maxDescLength - 3) + '...';
        }
        
        return `${prefix}${descText}${hashtags}${urlPart}`;
    }

    // Fetch and Render Releases
    async function fetchReleases() {
        // UI states
        feedContainer.classList.add('hidden');
        errorMessage.classList.add('hidden');
        exportCsvBtn.classList.add('hidden');
        skeleton.classList.remove('hidden');
        refreshBtn.querySelector('.spinner-icon').classList.add('spinning');
        refreshBtn.disabled = true;

        try {
            const response = await fetch('/api/releases');
            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }
            const data = await response.json();
            allReleases = data;
            renderFeed(data);
            exportCsvBtn.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching release notes:', error);
            errorText.textContent = error.message || 'Check your internet connection or server status.';
            errorMessage.classList.remove('hidden');
            updateCount.textContent = 'Error';
        } finally {
            skeleton.classList.add('hidden');
            refreshBtn.querySelector('.spinner-icon').classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }

    // Render the feed data
    function renderFeed(releases) {
        feedContainer.innerHTML = '';
        let totalUpdates = 0;

        if (releases.length === 0) {
            feedContainer.innerHTML = '<div class="no-selection-state"><p>No release notes found.</p></div>';
            updateCount.textContent = '0 updates';
            return;
        }

        releases.forEach((dayRelease, dayIndex) => {
            if (!dayRelease.updates || dayRelease.updates.length === 0) return;

            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';

            const divider = document.createElement('div');
            divider.className = 'date-divider';
            divider.textContent = dayRelease.date;
            dateGroup.appendChild(divider);

            dayRelease.updates.forEach((update, updateIndex) => {
                totalUpdates++;
                const card = document.createElement('div');
                card.className = 'update-card';
                
                // Identify the badge class
                const typeLower = update.type.toLowerCase();
                let badgeClass = 'update';
                if (typeLower.includes('feature')) badgeClass = 'feature';
                else if (typeLower.includes('issue')) badgeClass = 'issue';
                else if (typeLower.includes('deprecation') || typeLower.includes('notice')) badgeClass = 'deprecation';

                card.innerHTML = `
                    <div class="card-header">
                        <span class="badge ${badgeClass}">${update.type}</span>
                        <div class="card-header-actions">
                            <span class="card-date">${dayRelease.date}</span>
                            <button class="btn-copy" title="Copy to Clipboard">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        ${update.description}
                    </div>
                `;

                // Copy to Clipboard logic
                const copyBtn = card.querySelector('.btn-copy');
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Avoid triggering card selection
                    const plainText = cleanHtmlText(update.description).trim();
                    const formattedText = `BigQuery Update [${dayRelease.date}] (${update.type}):\n${plainText}`;

                    navigator.clipboard.writeText(formattedText).then(() => {
                        copyBtn.classList.add('copied');
                        copyBtn.innerHTML = `
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        `;
                        setTimeout(() => {
                            copyBtn.classList.remove('copied');
                            copyBtn.innerHTML = `
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            `;
                        }, 1500);
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                    });
                });

                // Handle selecting card
                card.addEventListener('click', () => {
                    document.querySelectorAll('.update-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    selectUpdate(update, dayRelease.date, dayRelease.link);
                });

                dateGroup.appendChild(card);
            });

            feedContainer.appendChild(dateGroup);
        });

        updateCount.textContent = `${totalUpdates} updates`;
        feedContainer.classList.remove('hidden');
    }

    // Select specific update to compose tweet
    function selectUpdate(update, date, link) {
        selectedUpdate = { update, date, link };
        
        noSelectionState.classList.add('hidden');
        composerState.classList.remove('hidden');

        // Update badge styling in composer
        selectedTypeBadge.textContent = update.type;
        selectedTypeBadge.className = 'badge';
        const typeLower = update.type.toLowerCase();
        if (typeLower.includes('feature')) selectedTypeBadge.classList.add('feature');
        else if (typeLower.includes('issue')) selectedTypeBadge.classList.add('issue');
        else if (typeLower.includes('deprecation') || typeLower.includes('notice')) selectedTypeBadge.classList.add('deprecation');
        else selectedTypeBadge.classList.add('update');

        selectedDate.textContent = date;

        // Generate draft text
        const draft = generateTweetDraft(date, update.type, update.description, link);
        tweetTextarea.value = draft;
        updateCharCount();
    }

    // Character counter updates
    function updateCharCount() {
        const text = tweetTextarea.value;
        
        // Count URLs correctly as Twitter standard 23 chars
        const urlRegex = /https?:\/\/[^\s]+/g;
        let length = text.length;
        const matches = text.match(urlRegex);
        
        if (matches) {
            matches.forEach(url => {
                length = length - url.length + 23;
            });
        }

        charCounter.textContent = length;
        if (length > 280) {
            charCounter.parentElement.classList.add('danger');
        } else {
            charCounter.parentElement.classList.remove('danger');
        }
    }

    tweetTextarea.addEventListener('input', updateCharCount);

    // Tweet button click handler
    tweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const encodedText = encodeURIComponent(text);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    });

    // Export to CSV button click handler
    exportCsvBtn.addEventListener('click', () => {
        if (allReleases.length === 0) return;
        
        let csvContent = "\ufeff"; // Add UTF-8 BOM for proper Excel encoding
        csvContent += "Date,Type,Description,Link\n";
        
        allReleases.forEach(dayRelease => {
            dayRelease.updates.forEach(update => {
                const plainText = cleanHtmlText(update.description).trim().replace(/"/g, '""');
                const escapedDate = dayRelease.date.replace(/"/g, '""');
                const escapedType = update.type.replace(/"/g, '""');
                const escapedLink = dayRelease.link.replace(/"/g, '""');
                csvContent += `"${escapedDate}","${escapedType}","${plainText}","${escapedLink}"\n`;
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "bigquery_release_notes.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Refresh & Retry button listeners
    refreshBtn.addEventListener('click', fetchReleases);
    retryBtn.addEventListener('click', fetchReleases);

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle.querySelector('.theme-icon-light');
    const moonIcon = themeToggle.querySelector('.theme-icon-dark');

    // Retrieve saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
            localStorage.setItem('theme', 'light');
        }
    });

    // Initial Fetch
    fetchReleases();
});
