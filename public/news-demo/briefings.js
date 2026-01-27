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
        
        // (1.5) QUICK SUMMARY - Brief overview before detailed sections
        let quickSummaryHTML = '';
        if (hotspot.briefing) {
            // Extract first fact from each theme for quick overview
            const briefingLines = hotspot.briefing.split('\n').filter(l => l.trim());
            const summaryPoints = [];
            
            // Get first bullet point from each theme (simple heuristic)
            let currentTheme = '';
            let pointsPerTheme = {};
            
            for (let line of briefingLines) {
                // Check if it's a theme header (bold text without colon)
                if (line.includes('**') && !line.includes(':') && !line.startsWith('•')) {
                    currentTheme = line.replace(/\*\*/g, '').trim();
                    pointsPerTheme[currentTheme] = [];
                } else if (line.startsWith('•') && currentTheme) {
                    // Add first bullet of each theme to summary
                    if (pointsPerTheme[currentTheme].length === 0) {
                        pointsPerTheme[currentTheme].push(line.substring(1).trim());
                    }
                }
            }
            
            // Build summary from collected points (max 4 for brevity)
            const allPoints = Object.values(pointsPerTheme).flat().slice(0, 4);
            
            if (allPoints.length > 0) {
                quickSummaryHTML = `
                    <div class="quick-summary">
                        <h4>At a Glance</h4>
                        <div class="summary-text">
                            ${allPoints.map(point => {
                                // Clean up the point - remove markdown, keep just the key info
                                let cleaned = point
                                    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
                                    .replace(/\[(.*?)\]/g, '') // Remove scope brackets
                                    .replace(/_\([^)]+\)_/g, '') // Remove certainty notes
                                    .replace(/\([^)]+\)/g, '') // Remove timeframes in parens
                                    .trim();
                                
                                // Extract just actor and action (first two parts before colon)
                                const parts = cleaned.split(':');
                                if (parts.length >= 2) {
                                    const actor = parts[0].trim();
                                    const action = parts[1].trim().split('.')[0]; // First sentence only
                                    return `${actor}: ${action}.`;
                                }
                                return cleaned;
                            }).join(' ')}
                        </div>
                    </div>
                `;
            }
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
        
        // Sources section removed - not available in weekly aggregated data
        const sourcesHTML = '';
        
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
            
            <div class="briefing-body">
                ${driversHTML}
                ${quickSummaryHTML}
                ${salienceHTML}
                ${theaterHTML}
                ${escalationHTML}
                ${perspectivesHTML}
                ${eventsHTML}
                ${sourcesHTML}
            </div>
        `;

        // Add click handler to toggle card
        const header = card.querySelector('.briefing-header');
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.toggle('collapsed');
        });

        // Start collapsed by default
        card.classList.add('collapsed');

        container.appendChild(card);
    });

    // Handle hash navigation - expand target card
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                // Expand only this card
                target.classList.remove('collapsed');
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

// Render possible stories section
function renderPossibleStories(possibleStoriesByCountry) {
    if (!possibleStoriesByCountry || Object.keys(possibleStoriesByCountry).length === 0) {
        return '';
    }
    
    let html = `
        <div class="possible-stories-section">
            <h2 class="possible-stories-title">Other Possible Stories</h2>
            <div class="possible-stories-note">
                Additional stories identified from RSS feeds with limited source content. 
                These are analyzed from headlines only.
            </div>
    `;
    
    for (const [countryCode, data] of Object.entries(possibleStoriesByCountry)) {
        const themes = data.themes || [];
        const articles = data.articles || [];
        
        html += `
            <div class="possible-country-section">
                <h3 class="possible-country-name">${countryCode} (${data.count} stories)</h3>
        `;
        
        for (const theme of themes) {
            html += `
                <div class="possible-theme">
                    <div class="possible-theme-name">${theme.name}</div>
                    <div class="possible-theme-summary">${theme.summary}</div>
                    <ul class="possible-articles-list">
            `;
            
            // Show articles for this theme
            const themeArticleIndices = theme.articles || [];
            for (const idx of themeArticleIndices.slice(0, 5)) { // Max 5 per theme
                const article = articles[idx - 1]; // 1-indexed to 0-indexed
                if (article) {
                    html += `
                        <li>
                            <a href="${article.url}" target="_blank" class="possible-article-link">
                                ${article.title}
                            </a>
                            <span class="possible-article-meta">
                                ${article.source} • ${article.tier} • ${article.perspective}
                            </span>
                        </li>
                    `;
                }
            }
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        html += `</div>`;
    }
    
    html += `</div>`;
    
    return html;
}

async function loadData() {
    try {
        const response = await fetch('data/daily_briefing.json');
        const data = await response.json();

        // Calculate average salience for tension index
        const avgSalience = data.hotspots.reduce((sum, h) => sum + (h.salience || 100), 0) / data.hotspots.length;
        document.getElementById('tension-value').textContent = Math.round(avgSalience);
        document.getElementById('timestamp').textContent = 
            `7-day average (updated: ${formatLocalTime(data.generated_at || data.date_range.end)})`;

        renderBriefings(data.hotspots);
        
        // Render possible stories if available
        const possibleStoriesHTML = renderPossibleStories(data.possible_stories);
        if (possibleStoriesHTML) {
            const container = document.getElementById('briefings-container');
            container.insertAdjacentHTML('beforeend', possibleStoriesHTML);
        }

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

loadData();