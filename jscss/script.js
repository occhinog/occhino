// ── Copyright year ──────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ── Mobile nav toggle ────────────────────────────
const toggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.classList.toggle('active');
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
    });
});

// ── Dropdown toggle ──────────────────────────────
const dropdownToggle = document.querySelector('.nav-dropdown-toggle');
if (dropdownToggle) {
    dropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = dropdownToggle.getAttribute('aria-expanded') === 'true';
        dropdownToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-item--dropdown')) {
            dropdownToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// ── Email section: live preview & prefilled mailto ──
(function () {
    const nomeEl = document.getElementById('emailNome');
    const cognomeEl = document.getElementById('emailCognome');
    const previewEl = document.getElementById('emailPreview');
    const nameEl = document.getElementById('emailPreviewName');
    const btnEl = document.getElementById('emailRequestBtn');

    // Convert a plain string to a safe email local-part
    function toEmailPart(str) {
        return str
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // strip accents (à→a, è→e …)
            .replace(/\s+/g, '.')            // spaces → dots
            .replace(/[^a-z0-9.]/g, '')      // keep only letters, digits, dots
            .replace(/\.{2,}/g, '.')         // no consecutive dots
            .replace(/^\.+|\.+$/g, '');      // no leading / trailing dots
    }

    function update() {
        const nome = nomeEl.value.trim();
        const cognome = cognomeEl.value.trim();
        const nPart = toEmailPart(nome);
        const cPart = toEmailPart(cognome);

        // Build address string
        let addr = '';
        if (nPart && cPart) addr = nPart + '.' + cPart;
        else if (nPart) addr = nPart;
        else if (cPart) addr = cPart;

        // Update preview card
        previewEl.innerHTML = '<span class="preview-live">' + nPart + '@occhino.it</span>';

        // Build prefilled Italian email body
        const subject = nome
            ? 'Richiesta indirizzo @occhino.it — ' + nPart
            : 'Richiesta indirizzo @occhino.it';

        const body = 'Ciao,\n\n'
            + 'mi chiamo ' + nome + ' ' + cognome + ' e vorrei ricevere informazioni '
            + 'per ottenere un indirizzo email personalizzato '
            + nPart + '@occhino.it.\n\n'
            + 'Grazie.';

        btnEl.href = 'mailto:info@occhino.it'
            + '?subject=' + encodeURIComponent(subject)
            + '&body=' + encodeURIComponent(body);
    }

    nomeEl.addEventListener('input', update);
    cognomeEl.addEventListener('input', update);
})();

// ── Modal Control ───────────────────────────────
function setupModal(modalId, openBtnId, closeBtnId, overlayId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);
    const overlay = document.getElementById(overlayId);

    if (!modal || !openBtn || !closeBtn || !overlay) return;

    function openModal() {
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeModal();
        }
    });
}

// Initialize both modals
setupModal('codice-fiscale-modal', 'openCodiceModal', 'codiceModalClose', 'codiceModalOverlay');
setupModal('webmail-modal', 'openWebmailModal', 'webmailModalClose', 'webmailModalOverlay');

// ── Codice Fiscale Calculator ────────────────────
(function () {
    const btn = document.getElementById('codiceCalcolaBtn');
    const cognomeEl = document.getElementById('codiceCognome');
    const nomeEl = document.getElementById('codiceNome');
    const sessoEl = document.getElementById('codiceSesso');
    const luogoEl = document.getElementById('codiceLuogo');
    const dataEl = document.getElementById('codiceData');
    const resultEl = document.getElementById('codiceResult');

    // Fallback local database (limited)
    const comuniMapLocal = {
        'messina': 'F158',
        'palermo': 'H501',
        'catania': 'C351',
        'trapani': 'U502',
        'agrigento': 'A215',
        'caltanissetta': 'C283',
        'enna': 'D326',
        'ragusa': 'H598',
        'siracusa': 'I726',
        'limina': 'E815',
        'roccafiorita': 'H774',
        'roma': 'H501',
        'milano': 'F205',
        'napoli': 'N618',
        'torino': 'L219',
        'genova': 'D969',
        'venezia': 'L736',
    };

    // Try to fetch municipality code from API, fallback to local database
    async function getComuneCode(comuneName) {
        const normalized = cleanStr(comuneName).toLowerCase();

        // Check local database first (fast)
        if (comuniMapLocal[normalized]) {
            return comuniMapLocal[normalized];
        }

        // Try to fetch from open API (optional, for completeness)
        try {
            // Using a public Italian municipalities API
            const response = await fetch(
                `https://www.agenziaentrate.gov.it/servizi/codici/codici_comuni/?q=${encodeURIComponent(comuneName)}`
            );
            if (response.ok) {
                const data = await response.text();
                // Simple regex search for the code pattern (letter + 3 digits)
                const match = data.match(/([A-Z]\d{3})/);
                if (match) return match[1];
            }
        } catch (e) {
            // API unavailable, use fallback
        }

        // Fallback: return placeholder
        return 'Z000';
    }

    function cleanStr(str) {
        return (str || '')
            .toUpperCase()
            .trim()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')  // remove accents/diacritics
            .replace(/\s+/g, '');   // remove ALL spaces (compound names rule)
    }

    function extractConsonants(str) {
        return (str || '').replace(/[aeiouAEIOU]/gi, '');
    }

    function extractVowels(str) {
        return (str || '').replace(/[^aeiouAEIOU]/gi, '');
    }

    function getSurnameCode(cognome) {
        const consonants = extractConsonants(cognome);
        const vowels = extractVowels(cognome);
        let code = consonants.slice(0, 3);
        if (code.length < 3) {
            code += vowels.slice(0, 3 - code.length);
        }
        return (code + 'XXX').slice(0, 3);
    }

    function getNameCode(nome) {
        const consonants = extractConsonants(nome);
        const vowels = extractVowels(nome);

        let code;
        if (consonants.length >= 4) {
            // If 4+ consonants: take 1st, 3rd, 4th
            code = consonants[0] + consonants[2] + consonants[3];
        } else {
            // Otherwise: take all consonants
            code = consonants.slice(0, 3);
        }

        if (code.length < 3) {
            code += vowels.slice(0, 3 - code.length);
        }

        return (code + 'XXX').slice(0, 3);
    }

    function getDateCode(dateStr, sesso) {
        const [year, month, day] = dateStr.split('-');
        const yy = year.slice(-2);

        // Month encoded as letter: A=01, B=02, ..., L=12
        const monthLetters = 'ABCDEFGHIJKL';
        const mmLetter = monthLetters[parseInt(month) - 1];

        let dd = parseInt(day);

        // For females, add 40 to day only
        if (sesso === 'F') {
            dd += 40;
        }

        return yy + mmLetter + String(dd).padStart(2, '0');
    }

    function calculateCheckDigit(code) {
        // Official lookup tables from Agenzia delle Entrate
        const oddValues = {
            'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
            'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
            'U': 15, 'V': 17, 'W': 19, 'X': 21, 'Y': 1, 'Z': 2,
            '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21
        };

        const evenValues = {
            'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
            'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
            'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25,
            '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
        };

        const checkChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        let sum = 0;
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const position = i + 1; // 1-indexed

            if (position % 2 === 1) {
                // Odd position (1, 3, 5, 7, 9, 11, 13, 15)
                sum += oddValues[char] || 0;
            } else {
                // Even position (2, 4, 6, 8, 10, 12, 14)
                sum += evenValues[char] || 0;
            }
        }

        return checkChars[sum % 26];
    }

    async function calculateCodiceFiscale() {
        const cognome = cleanStr(cognomeEl.value);
        const nome = cleanStr(nomeEl.value);
        const sesso = sessoEl.value;
        const luogo = luogoEl.value;  // Don't clean yet, pass to async function
        const data = dataEl.value;

        if (!cognome || !nome || !sesso || !luogo || !data) {
            resultEl.innerHTML = '<span class="result-placeholder">Completa tutti i campi</span>';
            return;
        }

        const surnameCode = getSurnameCode(cognome);
        const nameCode = getNameCode(nome);
        const dateCode = getDateCode(data, sesso);
        const comuneCode = await getComuneCode(luogo);

        const base15 = surnameCode + nameCode + dateCode + comuneCode;
        const checkDigit = calculateCheckDigit(base15);
        const codiceFiscale = base15 + checkDigit;

        resultEl.innerHTML = '<span style="color: var(--sienna); font-weight: 600; letter-spacing: 0.05em; font-family: \'Courier New\', monospace;">' + codiceFiscale + '</span>';
    }

    if (btn) {
        btn.addEventListener('click', calculateCodiceFiscale);
        // For real-time calculation, only use change events (not input, since API calls are async)
        [sessoEl, dataEl].forEach(el => {
            if (el) el.addEventListener('change', calculateCodiceFiscale);
        });
    }
})();

// ── Weather Data Fetcher (Open-Meteo) ───────────
(function () {
    const locations = {
        roccafiorita: { lat: 37.8333, lon: 15.1667, name: 'Roccafiorita' },
        limina: { lat: 38.1833, lon: 15.2833, name: 'Limina' }
    };

    function getWeatherIcon(code, isDay) {
        const iconMap = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌦️', 55: '🌦️',
            61: '🌧️', 63: '🌧️', 65: '⛈️',
            71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️',
            80: '🌧️', 81: '⛈️', 82: '⛈️',
            85: '❄️', 86: '❄️',
            95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return iconMap[code] || '🌡️';
    }

    function getWeatherDescription(code) {
        const descriptions = {
            0: 'Sereno', 1: 'Poco nuvoloso', 2: 'Variabile', 3: 'Nuvoloso',
            45: 'Nebbioso', 48: 'Nebbia gelata',
            51: 'Pioggia leggera', 53: 'Pioggia moderata', 55: 'Pioggia forte',
            61: 'Pioggia', 63: 'Pioggia moderata', 65: 'Pioggia forte',
            71: 'Neve leggera', 73: 'Neve', 75: 'Neve forte', 77: 'Neve',
            80: 'Pioggia', 81: 'Temporale', 82: 'Temporale forte',
            85: 'Pioggia di neve', 86: 'Pioggia di neve',
            95: 'Temporale', 96: 'Temporale con grandine', 99: 'Temporale con grandine'
        };
        return descriptions[code] || 'Caricamento...';
    }

    async function fetchWeather(location) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=Europe/Rome`;
            const response = await fetch(url);
            const data = await response.json();
            const current = data.current;

            return {
                temp: Math.round(current.temperature_2m),
                condition: getWeatherDescription(current.weather_code),
                icon: getWeatherIcon(current.weather_code, true),
                humidity: current.relative_humidity_2m,
                wind: Math.round(current.wind_speed_10m)
            };
        } catch (error) {
            console.error(`Weather fetch failed for ${location.name}:`, error);
            return null;
        }
    }

    function displayWeather(location, weatherData) {
        const key = location.toLowerCase().replace(/\s+/g, '');
        if (!weatherData) {
            document.getElementById(`weather${key.charAt(0).toUpperCase() + key.slice(1)}`).innerHTML =
                '<p style="color: var(--warm-gray);">Dati non disponibili</p>';
            return;
        }

        const cap = location.charAt(0).toUpperCase() + location.slice(1);
        document.getElementById(`weatherIcon${cap}`).textContent = weatherData.icon;
        document.getElementById(`weatherTemp${cap}`).textContent = weatherData.temp + '°C';
        document.getElementById(`weatherCondition${cap}`).textContent = weatherData.condition;
        document.getElementById(`weatherDetails${cap}`).textContent =
            `💨 ${weatherData.wind} km/h • 💧 ${weatherData.humidity}%`;
    }

    async function loadAllWeather() {
        for (const [key, location] of Object.entries(locations)) {
            const data = await fetchWeather(location);
            displayWeather(key, data);
        }
    }

    loadAllWeather();
    setInterval(loadAllWeather, 30 * 60 * 1000); // Refresh every 30 minutes
})();

(function () {
    var clicks = 0, timer;
    document.querySelector('.logo-svg--footer').addEventListener('click', function (e) {
        if (!e.shiftKey) { clicks = 0; return; }
        clicks++;
        clearTimeout(timer);
        timer = setTimeout(function () { clicks = 0; }, 5000);
        if (clicks >= 3) {
            clicks = 0;
            window.open('projects/index.html');
        }
    });
})();