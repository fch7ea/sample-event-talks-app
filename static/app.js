document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const feedContainer = document.getElementById('feed-container');
    const skeleton = document.getElementById('loading-skeleton');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const refreshBtn = document.getElementById('refresh-btn');
    const retryBtn = document.getElementById('retry-btn');
    const updateCount = document.getElementById('update-count');
    
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
                        <span class="card-date">${dayRelease.date}</span>
                    </div>
                    <div class="card-body">
                        ${update.description}
                    </div>
                `;

                // Handle selecting
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
        // Simple URL finder regex
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

    // Refresh & Retry button listeners
    refreshBtn.addEventListener('click', fetchReleases);
    retryBtn.addEventListener('click', fetchReleases);

    // Initial Fetch
    fetchReleases();
});
