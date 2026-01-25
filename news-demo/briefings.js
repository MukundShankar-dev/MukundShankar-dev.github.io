function parseMarkdownToBriefing(markdown) {
    // Parse markdown format to HTML - handles bullets and themes
    let html = markdown;
    
    // Convert **Theme Headers**
    html = html.replace(/\*\*([^*]+)\*\*/g, function(match, content) {
        // Check if it looks like an actor name (in a bullet context)
        if (content.match(/^[A-Z]/)) {
            return '<strong class="actor-name">' + content + '</strong>';
        }
        return '<strong>' + content + '</strong>';
    });
    
    // Remove --- separators (not needed in new layout)
    html = html.replace(/^---$/gm, '');
    
    // Convert _(text)_ to em
    html = html.replace(/_\((.*?)\)_/g, '<em class="certainty-note">($1)</em>');
    
    // Convert bullets with enhanced parsing
    const lines = html.split('\n');
    const processed = [];
    let inList = false;
    
    for (let line of lines) {
        line = line.trim();
        
        if (line.startsWith('•')) {
            if (!inList) {
                processed.push('<ul class="fact-list">');
                inList = true;
            }
            // Extract bullet content
            const content = line.substring(1).trim();
            processed.push(`<li>${content}</li>`);
        } else if (line) {
            if (inList) {
                processed.push('</ul>');
                inList = false;
            }
            // Check if it's a theme header
            if (line.includes('<strong>') && !line.includes(':')) {
                processed.push('<h3 class="theme-header">' + line + '</h3>');
            } else {
                processed.push('<p>' + line + '</p>');
            }
        } else if (inList) {
            // Empty line closes list
            processed.push('</ul>');
            inList = false;
        }
    }
    
    if (inList) {
        processed.push('</ul>');
    }
    
    return processed.join('\n');
}

function renderBriefings(hotspots) {
    const container = document.getElementById('briefings-container');
    container.innerHTML = '';

    hotspots.forEach((hotspot, index) => {
        const card = document.createElement('div');
        card.className = 'briefing-card';
        card.id = `hotspot-${hotspot.country_code}`;

        const metadata = hotspot.analyst_metadata || {};
        const salience = metadata.max_salience || 0;
        const theater = metadata.primary_theater || 'Other';
        const themeSalience = metadata.theme_salience || {};
        const timeline = metadata.timeline || {};
        const theaters = metadata.theaters || [theater];
        
        // (1) DRIVERS OF TENSION - Extract top themes as bullet points
        let driversHTML = '';
        if (hotspot.themes && hotspot.themes.length > 0) {
            const topThemes = hotspot.themes.slice(0, 5);
            driversHTML = `
                <div class="drivers-section">
                    <h4>Drivers of Elevated Tension</h4>
                    <ul class="drivers-list">
                        ${topThemes.map(theme => {
                            const themeScore = themeSalience[theme] || 0;
                            const icon = themeScore >= 80 ? '🔴' : themeScore >= 60 ? '🟡' : '🟢';
                            return `<li>${icon} ${theme}</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }
        
        // (2) SALIENCE / RANKED THEMES - Organize by tier
        let salienceHTML = '';
        if (Object.keys(themeSalience).length > 0) {
            const tier1 = [];
            const tier2 = [];
            const tier3 = [];
            const tier4 = [];
            
            Object.entries(themeSalience).forEach(([theme, score]) => {
                if (score >= 80) tier1.push({theme, score});
                else if (score >= 60) tier2.push({theme, score});
                else if (score >= 40) tier3.push({theme, score});
                else tier4.push({theme, score});
            });
            
            salienceHTML = '<div class="salience-section">';
            
            if (tier1.length > 0) {
                salienceHTML += `
                    <div class="salience-tier">
                        <div class="tier-header tier-1">🔴 Tier 1: Critical / War Risk</div>
                        <ul class="tier-list">
                            ${tier1.map(t => `<li>${t.theme} <span class="score">(${t.score})</span></li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (tier2.length > 0) {
                salienceHTML += `
                    <div class="salience-tier">
                        <div class="tier-header tier-2">🟡 Tier 2: Strategic Posture</div>
                        <ul class="tier-list">
                            ${tier2.map(t => `<li>${t.theme} <span class="score">(${t.score})</span></li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (tier3.length > 0) {
                salienceHTML += `
                    <div class="salience-tier">
                        <div class="tier-header tier-3">🟢 Tier 3: Contextual</div>
                        <ul class="tier-list">
                            ${tier3.map(t => `<li>${t.theme} <span class="score">(${t.score})</span></li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            if (tier4.length > 0) {
                salienceHTML += `
                    <div class="salience-tier">
                        <div class="tier-header tier-4">⚪ Tier 4: Peripheral</div>
                        <ul class="tier-list">
                            ${tier4.map(t => `<li>${t.theme} <span class="score">(${t.score})</span></li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            salienceHTML += '</div>';
        }
        
        // (3) THEATER CONTEXT - Group themes by theater
        let theaterHTML = '';
        if (theaters.length > 0) {
            theaterHTML = `
                <div class="theater-section">
                    <h4>Theater Analysis</h4>
                    ${theaters.map(th => `
                        <div class="theater-block">
                            <div class="theater-name">✦ ${th}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // (4) ESCALATION & DIRECTIONALITY
        let escalationHTML = '';
        if (timeline.escalation_trajectory) {
            const trajectory = timeline.escalation_trajectory;
            const terminalLevel = timeline.terminal_escalation || 0;
            const duration = timeline.duration_days || 1;
            
            let trendIcon = '→';
            let trendLabel = 'Stable';
            let trendClass = 'stable';
            
            if (trajectory === 'ASCENDING') {
                trendIcon = '↗️';
                trendLabel = 'Rising';
                trendClass = 'rising';
            } else if (trajectory === 'DESCENDING') {
                trendIcon = '↘️';
                trendLabel = 'Cooling';
                trendClass = 'cooling';
            }
            
            escalationHTML = `
                <div class="escalation-section">
                    <h4>Escalation Trend</h4>
                    <div class="escalation-indicator ${trendClass}">
                        <span class="trend-icon">${trendIcon}</span>
                        <span class="trend-label">${trendLabel}</span>
                        <span class="trend-detail">Terminal level: ${terminalLevel}/10 over ${duration} days</span>
                    </div>
                </div>
            `;
        }
        
        // (5) RAW STRUCTURED EVENTS - Collapsed by default
        const parsedBriefing = parseMarkdownToBriefing(hotspot.briefing);
        const eventCount = (hotspot.briefing.match(/•/g) || []).length;
        
        const eventsHTML = `
            <div class="events-section collapsed">
                <div class="events-header" onclick="toggleEvents(this)">
                    <h4>Detailed Event Feed (${eventCount} events)</h4>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="events-content">
                    ${parsedBriefing}
                </div>
            </div>
        `;
        
        // (6) PERSPECTIVES - Above raw feed
        let perspectivesHTML = '';
        if (hotspot.perspectives && Object.keys(hotspot.perspectives).length > 0) {
            perspectivesHTML = `
                <div class="perspectives">
                    <h4>Key Perspectives</h4>
                    ${Object.entries(hotspot.perspectives).map(([actor, view]) => `
                        <div class="perspective-item">
                            <div class="perspective-actor">${actor}</div>
                            <div class="perspective-view">${view}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // (7) SOURCES - Collapsed at bottom, all sources sorted by quality
        const tierOrder = {'A': 1, 'B': 2, 'C': 3, 'D': 4};
        const sortedSources = [...hotspot.sources].sort((a, b) => {
            const tierA = tierOrder[a.tier] || 5;
            const tierB = tierOrder[b.tier] || 5;
            return tierA - tierB;
        });
        
        const sourcesHTML = `
            <div class="sources-section collapsed">
                <div class="sources-header" onclick="toggleSources(this)">
                    <h4>Sources (${hotspot.sources.length} total)</h4>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="sources-content">
                    ${sortedSources.map(source => `
                        <a href="${source.url}" target="_blank" class="source-link">
                            ${source.title} <span class="source-outlet">(${source.source})</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Assemble card in correct order
        card.innerHTML = `
            <div class="briefing-header">
                <div>
                    <div class="briefing-title">${hotspot.country_name}</div>
                    <div class="briefing-subtitle">
                        <span class="tension-badge">Tension: ${Math.min(10, Math.round(salience/10))}/10</span>
                        <span class="theater-badge">${theater}</span>
                    </div>
                </div>
                <span class="article-badge">${hotspot.article_count} articles</span>
            </div>
            
            ${driversHTML}
            ${salienceHTML}
            ${theaterHTML}
            ${escalationHTML}
            ${perspectivesHTML}
            ${eventsHTML}
            ${sourcesHTML}
        `;

        container.appendChild(card);
    });

    // Handle hash navigation
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
}

// Toggle functions for collapsible sections
function toggleEvents(header) {
    const section = header.parentElement;
    const icon = header.querySelector('.toggle-icon');
    section.classList.toggle('collapsed');
    icon.textContent = section.classList.contains('collapsed') ? '▼' : '▲';
}

function toggleSources(header) {
    const section = header.parentElement;
    const icon = header.querySelector('.toggle-icon');
    section.classList.toggle('collapsed');
    icon.textContent = section.classList.contains('collapsed') ? '▼' : '▲';
}

// Make functions global for onclick handlers
window.toggleEvents = toggleEvents;
window.toggleSources = toggleSources;

function formatLocalTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

async function loadData() {
    try {
        const response = await fetch('data/daily_briefing.json');
        const data = await response.json();

        // Use aggregated hotspots from all 7 days
        document.getElementById('tension-value').textContent =
            Math.round(data.average_tension_index);
        document.getElementById('timestamp').textContent = 
            `7-day average (updated: ${formatLocalTime(data.aggregated_at)})`;

        renderBriefings(data.aggregated_hotspots);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

loadData();