export const COUNTRY_MAP: { [key: string]: string } = {
    "AF": "Afghanistan", "AL": "Albania", "DZ": "Algeria", "AS": "American Samoa", "AD": "Andorra", "AO": "Angola", "AQ": "Antarctica", "AG": "Antigua and Barbuda", "AR": "Argentina", "AM": "Armenia", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados", "BY": "Belarus", "BE": "Belgium", "BZ": "Belize", "BJ": "Benin", "BT": "Bhutan", "BO": "Bolivia", "BA": "Bosnia and Herzegovina", "BW": "Botswana", "BR": "Brazil", "BN": "Brunei", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi", "CV": "Cabo Verde", "KH": "Cambodia", "CM": "Cameroon", "CA": "Canada", "BQ": "Caribbean Netherlands", "CF": "Central African Republic", "TD": "Chad", "CL": "Chile", "CN": "China", "CX": "Christmas Island", "CC": "Cocos (Keeling) Islands", "CO": "Colombia", "KM": "Comoros", "CK": "Cook Islands", "CR": "Costa Rica", "HR": "Croatia", "CW": "Curacao", "CY": "Cyprus", "CZ": "Czechia", "CD": "Democratic Republic of the Congo", "DK": "Denmark", "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic", "EC": "Ecuador", "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea", "ER": "Eritrea", "EE": "Estonia", "SZ": "Eswatini", "ET": "Ethiopia", "FJ": "Fiji", "FI": "Finland", "FR": "France", "GF": "French Guiana", "PF": "French Polynesia", "TF": "French Southern and Antarctic Lands", "GA": "Gabon", "GE": "Georgia", "DE": "Germany", "GH": "Ghana", "GR": "Greece", "GD": "Grenada", "GU": "Guam", "GT": "Guatemala", "GG": "Guernsey", "GN": "Guinea", "GW": "Guinea-Bissau", "GY": "Guyana", "HT": "Haiti", "HM": "Heard Island and McDonald Islands", "HN": "Honduras", "HK": "Hong Kong", "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq", "IE": "Ireland", "IM": "Isle of Man", "IL": "Israel", "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JE": "Jersey", "JO": "Jordan", "KZ": "Kazakhstan", "KE": "Kenya", "KI": "Kiribati", "KW": "Kuwait", "KG": "Kyrgyzstan", "LA": "Laos", "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho", "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania", "LU": "Luxembourg", "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia", "MV": "Maldives", "ML": "Mali", "MT": "Malta", "MH": "Marshall Islands", "MR": "Mauritania", "MU": "Mauritius", "MX": "Mexico", "FM": "Micronesia", "MD": "Moldova", "MC": "Monaco", "MN": "Mongolia", "ME": "Montenegro", "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar (Burma)", "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NL": "Netherlands", "NC": "New Caledonia", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria", "NU": "Niue", "NF": "Norfolk Island", "MK": "North Macedonia", "MP": "Northern Mariana Islands", "NO": "Norway", "OM": "Oman", "PK": "Pakistan", "PW": "Palau", "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru", "PH": "Philippines", "PN": "Pitcairn Islands", "PL": "Poland", "PT": "Portugal", "PR": "Puerto Rico", "QA": "Qatar", "CG": "Republic of the Congo", "RO": "Romania", "RU": "Russia", "RW": "Rwanda", "BL": "Saint Barthelemy", "SH": "Saint Helena, Ascension and Tristan da Cunha", "KN": "Saint Kitts and Nevis", "LC": "Saint Lucia", "MF": "Saint Martin", "PM": "Saint Pierre and Miquelon", "VC": "Saint Vincent and the Grenadines", "WS": "Samoa", "SM": "San Marino", "ST": "Sao Tome and Principe", "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia", "SC": "Seychelles", "SL": "Sierra Leone", "SG": "Singapore", "SX": "Sint Maarten", "SK": "Slovakia", "SI": "Slovenia", "SB": "Solomon Islands", "SO": "Somalia", "ZA": "South Africa", "GS": "South Georgia and the South Sandwich Islands", "KR": "South Korea", "SS": "South Sudan", "ES": "Spain", "LK": "Sri Lanka", "SD": "Sudan", "SR": "Suriname", "SE": "Sweden", "CH": "Switzerland", "TW": "Taiwan", "TJ": "Tajikistan", "TZ": "Tanzania", "TH": "Thailand", "BS": "The Bahamas", "GM": "The Gambia", "TL": "Timor-Leste", "TG": "Togo", "TK": "Tokelau", "TO": "Tonga", "TT": "Trinidad and Tobago", "TN": "Tunisia", "TR": "Turkiye", "TM": "Turkmenistan", "TV": "Tuvalu", "UG": "Uganda", "UA": "Ukraine", "AE": "United Arab Emirates", "GB": "United Kingdom", "US": "United States", "UM": "United States Minor Outlying Islands", "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu", "VA": "Vatican City", "VE": "Venezuela", "VN": "Vietnam", "WF": "Wallis and Futuna", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe"
};

export const COUNTRIES_LIST = Object.entries(COUNTRY_MAP).map(([code, name]) => ({ code, name }));

export const ALL_LANGUAGES = [
    "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Catalan", "Cebuano", "Chichewa", "Chinese (Simplified)", "Chinese (Traditional)", "Corsican", "Croatian", "Czech", "Danish", "Dutch", "English (US)", "English (UK)", "Esperanto", "Estonian", "Filipino", "Finnish", "French", "Frisian", "Galician", "Georgian", "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hmong", "Hungarian", "Icelandic", "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada", "Kazakh", "Khmer", "Kinyarwanda", "Korean", "Kurdish (Kurmanji)", "Kyrgyz", "Lao", "Latin", "Latvian", "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", "Myanmar (Burmese)", "Nepali", "Norwegian", "Odia (Oriya)", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Samoan", "Scots Gaelic", "Serbian", "Sesotho", "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", "Swedish", "Tajik", "Tamil", "Tatar", "Telugu", "Thai", "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uyghur", "Uzbek", "Vietnamese", "Welsh", "Xhosa", "Yiddish", "Yoruba", "Zulu"
];

export const TRAFFIC_SOURCES = [
    { value: "Direct", label: "Direct" },
    { value: "Organic (General)", label: "Organic (General)" },
    { value: "Organic, Google Search", label: "Organic - Google Search" },
    { value: "Organic, Google News", label: "Organic - Google News" },
    { value: "Organic, Google Images", label: "Organic - Google Images" },
    { value: "Organic, Google Video", label: "Organic - Google Video" },
    { value: "Organic, Bing", label: "Organic - Bing" },
    { value: "Organic, DuckDuckGo", label: "Organic - DuckDuckGo" },
    { value: "Organic, YouTube", label: "Organic - YouTube" },
    { value: "Social (General)", label: "Social (General)" },
    { value: "Social, Instagram", label: "Social - Instagram" },
    { value: "Social, Facebook", label: "Social - Facebook" },
    { value: "Social, LinkedIn", label: "Social - LinkedIn" },
    { value: "Social, X, Twitter", label: "Social - X (Twitter)" },
    { value: "Social, Pinterest", label: "Social - Pinterest" },
    { value: "Referral", label: "Referral" },
    { value: "Chatbots (General)", label: "Chatbots (General)" },
    { value: "Chatbots, Meta AI", label: "Chatbots - Meta AI" },
    { value: "Chatbots, Perplexity AI", label: "Chatbots - Perplexity AI" },
    { value: "Chatbots, ChatGPT", label: "Chatbots - ChatGPT" },
    { value: "Chatbots, Claude AI", label: "Chatbots - Claude AI" },
    { value: "Chatbots, Mistral AI", label: "Chatbots - Mistral AI" },
    { value: "Chatbots, Microsoft Copilot", label: "Chatbots - Copilot" },
    { value: "Chatbots, Gemini", label: "Chatbots - Gemini" },
    { value: "Chatbots, Groq", label: "Chatbots - Groq" },
    { value: "Messengers (General)", label: "Messengers (General)" },
    { value: "Messengers, WhatsApp", label: "Messengers - WhatsApp" },
    { value: "Messengers, WeChat", label: "Messengers - WeChat" },
    { value: "Messengers, Telegram", label: "Messengers - Telegram" },
    { value: "Messengers, Viber", label: "Messengers - Viber" }
];

export const TIME_ON_PAGE_OPTS = [
    { value: "5 seconds", label: "5 seconds" },
    { value: "30 seconds", label: "30 seconds" },
    { value: "1 minute", label: "1 minute" },
    { value: "2 minutes", label: "2 minutes" },
    { value: "3 minutes", label: "3 minutes" },
    { value: "4 minutes", label: "4 minutes" },
    { value: "5 minutes", label: "5 minutes" }
];

export const generateTimezones = () => {
    const zones = [];
    for (let i = -12; i <= 14; i++) {
        const sign = i >= 0 ? '+' : '-';
        const abs = Math.abs(i);
        const label = `(GMT${sign}${abs.toString().padStart(2, '0')}:00) GMT${sign}${abs}`;
        zones.push({ value: `GMT${sign}${abs}`, label });

        if ([3, 4, 5, 6, 9].includes(abs)) {
            const labelHalf = `(GMT${sign}${abs.toString().padStart(2, '0')}:30) GMT${sign}${abs}:30`;
            zones.push({ value: `GMT${sign}${abs}:30`, label: labelHalf });
        }
    }
    return zones;
};

export const TIMEZONES = generateTimezones();
