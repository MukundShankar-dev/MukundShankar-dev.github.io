// ISO2 to numeric ID mappings
const iso2ToNumericId = {
    'US': '840', 'CN': '156', 'RU': '643', 'IN': '356', 'GB': '826',
    'FR': '250', 'DE': '276', 'JP': '392', 'BR': '076', 'IT': '380',
    'CA': '124', 'KR': '410', 'AU': '036', 'ES': '724', 'MX': '484',
    'ID': '360', 'NL': '528', 'SA': '682', 'TR': '792', 'CH': '756',
    'IL': '376', 'IR': '364', 'IQ': '368', 'SY': '760', 'LB': '422',
    'JO': '400', 'YE': '887', 'AE': '784', 'QA': '634', 'KW': '414',
    'OM': '512', 'BH': '048', 'PS': '275', 'EG': '818', 'LY': '434',
    'TN': '788', 'DZ': '012', 'MA': '504', 'SD': '729', 'UA': '804',
    'PL': '616', 'RO': '642', 'BE': '056', 'SE': '752', 'AT': '040',
    'NO': '578', 'DK': '208', 'FI': '246', 'GR': '300', 'PT': '620',
    'CZ': '203', 'HU': '348', 'BY': '112', 'RS': '688', 'HR': '191',
    'BG': '100', 'SK': '703', 'IE': '372', 'KP': '408', 'TW': '158',
    'VN': '704', 'TH': '764', 'MY': '458', 'SG': '702', 'PH': '608',
    'PK': '586', 'BD': '050', 'AF': '004', 'MM': '104', 'KH': '116',
    'LA': '418', 'NP': '524', 'LK': '144', 'MN': '496', 'KZ': '398',
    'UZ': '860', 'NZ': '554', 'NG': '566', 'ET': '231', 'ZA': '710',
    'KE': '404', 'TZ': '834', 'UG': '800', 'GH': '288', 'CD': '180',
    'AO': '024', 'MZ': '508', 'ZW': '716', 'RW': '646', 'SO': '706',
    'ML': '466', 'NE': '562', 'BF': '854', 'SN': '686', 'CI': '384',
    'CM': '120', 'AR': '032', 'CO': '170', 'VE': '862', 'CL': '152',
    'PE': '604', 'CU': '192', 'EC': '218', 'BO': '068', 'PY': '600',
    'UY': '858', 'GT': '320', 'HT': '332', 'NI': '558'
};

let svg, g, projection, path, zoom, defs;
let hotspotsData = [];
let countryIdToHotspot = {};

function getColor(articleCount) {
    let t;
    if (articleCount >= 9) t = 1.0;
    else if (articleCount >= 4) t = 0.5;
    else t = 0.0;

    if (t < 0.5) {
        const local = t / 0.5;
        return interpolateColor('#00ff00', '#ffff00', local);
    } else {
        const local = (t - 0.5) / 0.5;
        return interpolateColor('#ffff00', '#ff0000', local);
    }
}

function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function initMap() {
    const container = d3.select('#map-container');
    const width = window.innerWidth;
    const height = window.innerHeight;

    svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);

    defs = svg.append('defs');
    g = svg.append('g');

    projection = d3.geoMercator()
        .scale(150)
        .translate([width / 2, height / 1.5]);

    path = d3.geoPath().projection(projection);

    zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    d3.select('#zoom-in').on('click', () => {
        svg.transition().call(zoom.scaleBy, 1.5);
    });

    d3.select('#zoom-out').on('click', () => {
        svg.transition().call(zoom.scaleBy, 0.67);
    });

    d3.select('#zoom-reset').on('click', () => {
        svg.transition().call(zoom.transform, d3.zoomIdentity);
    });

    window.addEventListener('resize', () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        svg.attr('width', newWidth).attr('height', newHeight);
        projection.translate([newWidth / 2, newHeight / 1.5]);
        g.selectAll('path').attr('d', path);
    });
}

function loadWorldMap() {
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(world => {
            const countries = topojson.feature(world, world.objects.countries);

            // Build mapping
            hotspotsData.forEach(hotspot => {
                const numericId = iso2ToNumericId[hotspot.country_code];
                if (numericId) {
                    countryIdToHotspot[numericId] = hotspot;
                    countryIdToHotspot[String(parseInt(numericId))] = hotspot;
                }
            });

            // No gradients - just solid colors
            g.selectAll('path')
                .data(countries.features)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .attr('fill', d => {
                    const hotspot = countryIdToHotspot[String(d.id)];
                    if (hotspot) {
                        return getColor(hotspot.article_count);
                    }
                    return '#1a1f3a';
                })
                .classed('hotspot', d => {
                    return countryIdToHotspot[String(d.id)] !== undefined;
                })
                .on('mouseover', function (event, d) {
                    const hotspot = countryIdToHotspot[String(d.id)];
                    if (hotspot) {
                        showTooltip(event, hotspot);
                    }
                })
                .on('mousemove', function (event) {
                    const tooltip = d3.select('#tooltip');
                    tooltip
                        .style('left', (event.pageX + 15) + 'px')
                        .style('top', (event.pageY + 15) + 'px');
                })
                .on('mouseout', hideTooltip)
                .on('click', function (event, d) {
                    const hotspot = countryIdToHotspot[String(d.id)];
                    if (hotspot) {
                        // Show loading overlay
                        const loadingOverlay = document.getElementById('loading-overlay');
                        
                        // Get the bounds of the clicked country
                        const bounds = path.bounds(d);
                        const dx = bounds[1][0] - bounds[0][0];
                        const dy = bounds[1][1] - bounds[0][1];
                        const x = (bounds[0][0] + bounds[1][0]) / 2;
                        const y = (bounds[0][1] + bounds[1][1]) / 2;
                        
                        // Calculate zoom scale
                        const width = window.innerWidth;
                        const height = window.innerHeight;
                        const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
                        const translate = [width / 2 - scale * x, height / 2 - scale * y];
                        
                        // Zoom to country with smooth animation
                        svg.transition()
                            .duration(750)
                            .call(
                                zoom.transform,
                                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                            );
                        
                        // Show loading after brief delay (let zoom start)
                        setTimeout(() => {
                            loadingOverlay.classList.add('active');
                        }, 400);
                        
                        // Navigate to briefing after zoom animation
                        setTimeout(() => {
                            window.location.href = `briefings.html#hotspot-${hotspot.country_code}`;
                        }, 850);
                    }
                });
        })
        .catch(error => {
            console.error('Error loading world map:', error);
        });
}

function showTooltip(event, hotspot) {
    const tooltip = d3.select('#tooltip');

    tooltip.html(`
        <div class="tooltip-country">${hotspot.country_name}</div>
        <div class="tooltip-count">${hotspot.article_count} articles</div>
        <div class="tooltip-description">${hotspot.hover_text}</div>
        <a href="briefings.html#hotspot-${hotspot.country_code}" class="tooltip-link">Read full briefing →</a>
    `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY + 15) + 'px')
        .classed('visible', true);
    
    // Keep tooltip visible when hovering over it
    tooltip.on('mouseleave', hideTooltip);
}

function hideTooltip() {
    const tooltip = d3.select('#tooltip');
    // Small delay to allow moving from country to tooltip
    setTimeout(() => {
        if (!tooltip.node().matches(':hover')) {
            tooltip.classed('visible', false);
        }
    }, 100);
}

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
        hotspotsData = data.aggregated_hotspots;

        console.log('Loaded aggregated hotspots:', hotspotsData);

        // Show average tension index across the week
        document.getElementById('tension-value').textContent =
            Math.round(data.average_tension_index);
        document.getElementById('timestamp').textContent = 
            `7-day average (updated: ${formatLocalTime(data.aggregated_at)})`;

        loadWorldMap();

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Initialize
initMap();
loadData();