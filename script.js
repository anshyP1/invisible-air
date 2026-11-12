/* Invisible AIR — application script (extracted from AQI DATA DASHBOARD - Main.html)
   Sections, in original order:
   1. Data, AQI calculations and p5.js particle visualisation
   2. Locality selection, Leaflet map and search
   3. Presentation layer (motion, compare, opening, live estimate) */

/* ═════════ 1. DATA + VISUALISATION ═════════ */
// ══════════════════════════════════════════════════════════════════
//  LOCALITY DATA  (with map coordinates)
// ══════════════════════════════════════════════════════════════════
const LOCALITIES = [
  { id:'malad',    name:'Mindspace, Malad West', short:'MALAD WEST', station:'Mindspace Station', coords:[19.1750, 72.8369] },
  { id:'borivali', name:'Borivali',              short:'BORIVALI',    station:'Borivali Station', coords:[19.2307, 72.8567] },
  { id:'deonar',   name:'Deonar',                short:'DEONAR',      station:'Deonar Station',   coords:[19.0530, 72.9170] },
  { id:'bandra',   name:'Bandra',                short:'BANDRA',      station:'Bandra Station',   coords:[19.0596, 72.8295] },
  { id:'andheri',  name:'Andheri',               short:'ANDHERI',     station:'Andheri Station',  coords:[19.1136, 72.8697] },
  { id:'kurla',    name:'Kurla',                 short:'KURLA',       station:'Kurla Station',    coords:[19.0728, 72.8826] },
];
let selectedLocality = LOCALITIES[0];

// ══════════════════════════════════════════════════════════════════
//  NEWS / CAPTIONS
// ══════════════════════════════════════════════════════════════════
const NEWS_DATA = {
  all: [
    { headline:'Mumbai repeatedly recorded Poor AQI between 2023–2025 during winter months', source:'· Mid-Day', url:'https://www.mid-day.com/mumbai/mumbai-news/article/mumbai-although-bad-air-quality-this-december-was-better-than-last-year-23327549' },
  ],
  winter: [
    { headline:'Although bad, air quality this December was better than last year in Mumbai', source:'· Mid-Day', url:'https://www.mid-day.com/mumbai/mumbai-news/article/mumbai-although-bad-air-quality-this-december-was-better-than-last-year-23327549' },
    { headline:'AQI in 7 localities dips to Poor / Very Poor — Borivali worst hit', source:'· Times of India', url:'https://timesofindia.indiatimes.com/city/mumbai/aqi-in-7-localities-dips-to-poor-very-poor-in-1-borivli-worst-hit/articleshow/116660225.cms' },
  ],
  preSummer: [
    { headline:'Construction dust and vehicular emissions drive pre-monsoon pollution in Mumbai', source:'· Indian Express', url:'https://indianexpress.com/article/cities/mumbai/mumbai-aqi-levels-today-diwali-weather-10318152/' },
  ],
  summer: [
    { headline:'Mumbai AQI improves as sea breeze disperses pollutants during summer months', source:'· Indian Express', url:'https://indianexpress.com/article/cities/mumbai/mumbai-aqi-levels-today-diwali-weather-10318152/' },
  ],
  monsoon: [
    { headline:'Mumbai records cleanest air of the year — monsoon washes away PM2.5', source:'· The Hindu', url:'https://www.thehindu.com/news/cities/mumbai/festive-season-turns-hazardous-as-mumbai-records-worst-air-quality-of-2025/article70194132.ece' },
  ],
  postMonsoon: [
    { headline:'Festive season turns hazardous as Mumbai records worst air quality of 2025', source:'· The Hindu', url:'https://www.thehindu.com/news/cities/mumbai/festive-season-turns-hazardous-as-mumbai-records-worst-air-quality-of-2025/article70194132.ece' },
    { headline:'Mumbai AQI spikes during Diwali — firecracker emissions compound PM2.5', source:'· Indian Express', url:'https://indianexpress.com/article/cities/mumbai/mumbai-aqi-levels-today-diwali-weather-10318152/' },
  ],
};

const SEASON_CAPTIONS = {
  all:         '"Three years of Mumbai air — winter heaviness, monsoon clarity, and everything between."',
  winter:      '"Winter inversion traps particulates. Cold, still nights hold pollution close."',
  preSummer:   '"Construction dust and traffic choke March skies. Heat has not yet dispersed the haze."',
  summer:      '"Sea breezes arrive. The air lightens. A relative respite before the rains."',
  monsoon:     '"Rain cleans the air. The city breathes. AQI at its lowest — nature\'s reset."',
  postMonsoon: '"Diwali smoke rises. Festive fires compound the cooling air. Pollution spikes."',
};

// ══════════════════════════════════════════════════════════════════
//  RAW DAILY AQI DATA  (unchanged)
// ══════════════════════════════════════════════════════════════════
const RAW = {};
RAW[2023] = {
  6:  [33.8,35.3,31.8,37.6,33.5,28.3,33.2,35.9,39.2,40.8],
  7:  [42.6,45.3,47.4,43.7,46.8,54.6,42.9,37.5,48.2,47.7,46.3,49.5,47.6,43.2,44.8,44.6,39.9,39.1,40.8,43.5,40.2,33.8,35.1,30.6,30.7,34.2,31.6,32.3,35.4,44.9,54.8],
  8:  [55,56.3,47.9,52.7,59.6,51.8,47.7,39.2,41.7,40.2,41.3,43,38.9,35.5,40,35.8,41.6,40.7,36.2,33.3,30.8,35.1,38,38.3,43.5,42.2,45.8,61.5,67.8,60],
  9:  [67.7,82.1,92.5,86.3,52,89,82.3,84.6,99.9,88.1,62.7,78.7,127.7,149.5,100.8,124.2,99,90,90,95.1,158.4,176.6,208.9,178.5],
  10: [149.4,149.9,165.8,181.5,191.3,165.5,79.5,52.9,57.8,72.6,170.3,297.9,160.5,151.2,142.6,107,111.7,123.2,85.6,92.9,88.9,92.2,112.8,96.3,72.1,54.4,49.3,62.3,67.3],
  11: [131.6,162.4,131.6,119.1,129.4,173.7,141.3,93.6,91.4,101,94,98,105.4,125.7,130.4,112.9,109.2,111,119.5,103.3,108.7,152.4,186.5,185.5,165.4,159.4,167,236.6,210.8,152.7,130.8]
};
RAW[2024] = {
  0:  [132,123,110,125,106,111,112,89,170,80,132,93,64,53,58,70,121,241,121,186,161,99,126,206,204,144,144,116,157],
  1:  [96,51,102,164,178,146,140,140,113,104,105,142,148,118,120,260,173,150,80,46,34,41,63,89,97],
  2:  [116,96,147,86,64,62,52,55,61,72],
  3:  [78,121,97,60,61,154,67,50,64,69,49,43,49,170,105,69,64,54,160,58,76,44,64,67,59,166,87,77],
  4:  [73,90,51,42,37,60,65,59,85,48,42,44,78,68,75,68,46,56,45,56,66,48,50,53,47,48,57,44],
  5:  [34,38,46,57,49,46,48,46,58,40,44,41,36,38,29,49,40,38,34,44,37,61,35,37,38,31,38,41,37],
  6:  [52,41,53,47,41,48,52,43,39,36,38,33,30,34,39,34,34,25,29,30,32,35,32,37,36,41,46,49,48,47,36],
  7:  [40,31,32,36,37,34,29,36,36,30,31,34,33,34,27,24,28,35,32,41,31,43,29,22,29,38,26,22,24,15],
  8:  [26,33,29,29,26,25,23,22,19,30,37,35,38,48,42,49,53,58,50,50,46,40,38,35,25,19,25,33],
  9:  [50,50,50,53,33,32,55,95,76,52,60,188,38,32,37,65,82,27,41,36,54,55,80,114,128,198,162,87,73,223],
  10: [256,232,179,90,89,79,85,57,57,75,80,79,58,142,185,233,139,104,195,158,151,153,173,156,126,169,116,111,116],
  11: [155,155,132,98,102,98,96,160,83,113,133,123,109,97,120,142,150,142,124,151,126,115,114,144,127,136,138,154,106,111]
};
RAW[2025] = {
  0:  [132.6,102.7,101.6,104.3,124.8,112,112,131.6,130.5,126.7,150.5,118,115.7,133.5,133.4,121.5,130.1,122.3,151.8,103,122,150.8,124.3,104.5,147.3,177.5,147.7,118.3,103.8,94.7,99.6],
  1:  [63.4,93.4,107.6,98.5,91,92.6,113.6,119.9,120,120,119.6,101.6,96.5,105.9,113.4,111.6,87.8,98.8,108.9,108,96.2,136.5,126.6,117.6,109.8,128.7,147.6,148.9],
  2:  [112,101.7,112.1,120.1,116.3,138.6,134.6,106.2,91.1,87.8,134.8,120.2,108.4,91.8,63.5,62.3,82.6,101.3,79.5,70,70.9,88.3,67.1,82.3,61.6,46.8,45.6,97.8,96.1],
  3:  [71.4,86.4,88.6,59,67.9,61.2,58.6,71.8,67.8,50.3,40.6,37.7,42.9,43.4,49.7,43.3,42.6,31.6,42.6,48.8,56.7,80.4,72.4,54.1,47.8,51.6,52.6,51.2,46.5],
  4:  [40.1,37.5,42.5,42.6,40.6,39.4,42.5,29.3,39.6,54.8,41.8,30.9,31.5,58.8,71.6,60.3,46.5,43.2,50.1,56.5,53.5,46.6,40.9,71.6,57.3,46.8,44,41.5,52.4,72.8,73.6],
  5:  [48.7,43.8,48.9,41.7,52.9,81.5,52.1,51.2,64.1,59.6,40.8,33.7,32.4,31,40.6,44,46.6,36.4,36.6,39,41,43.6,42.4,42.6,48.8,47.5,46.5,47.9,46.1,38.9],
  6:  [37.6,37.5,30.1,33.8,34.2,37.3,41.6,43.9,47,47.6,42,39,36.8,27,25.1,38.2,47.7,111.5,71,50,50,48,40.2,35.5,33.3,33.2,33.5,38.5,39.8,40],
  7:  [40,40,42,50.5,46.6,45.8,48.8,48,44.3,44,44,43,38.5,38,38,38,38,38,38,38,38,37.7,36.5,36,36,36,36,36,36,36,36],
  8:  [36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,36,33.2,30,30,33.4,34,34,34,34],
  9:  [34,34,35.6,47.6,50.4,41.6,46.6,50.6,55.6,54.6,95.5,107,108.5,104.4,139.7,121,106.8,114,157.6,187.5,192,139.8,118,73.5,34,36.3,62.9,41,45.3,39.8,51.6],
  10: [49.3,44.6,49.6,53.2,52.8,84.7,118.5,69.4,90,78,101.6,107.1,117,113.4,114.3,123.1,127.3,140.1,147.6,120.5,141.9,183.7,148.5,139.4,155.3,161.3,146,108.5,97.5,67.8],
  11: [82.5,103.6,118.3,110.8,115.4,93.6,89.1,90.8,114,121.5,118.4,109.8,96,90.4,84.5,99.7,156.6,189.5,186.7,109.6,61.6,65.5,84.3,72.3,86.9,111.7,126.6,126.9,119.5,121.8,123.5]
};

const NO_DATA_ZONES = new Set(['2023-preSummer','2023-summer','2025-winter']);

const SEASON_MONTHS = {
  all:[0,1,2,3,4,5,6,7,8,9,10,11],
  preSummer:[2,3], summer:[4,5], monsoon:[6,7,8], postMonsoon:[9,10]
};
const SEASON_LABEL = {
  all:'All Year', winter:'Winter (Dec – Feb)', preSummer:'Pre-Summer (Mar – Apr)',
  summer:'Summer (May – Jun)', monsoon:'Monsoon (Jul – Sep)', postMonsoon:'Post-Monsoon (Oct – Nov)'
};
const YEAR_SEASON_AVG = {
  2023:{ all:95.2,  winter:126.9, preSummer:null, summer:null, monsoon:40.73, postMonsoon:117.95 },
  2024:{ all:80.2,  winter:120.2, preSummer:81.3, summer:46.7, monsoon:31.73, postMonsoon:81.6   },
  2025:{ all:76.0,  winter:null,  preSummer:74.5, summer:47.1, monsoon:39.1,  postMonsoon:100.0  }
};
const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// ══════════════════════════════════════════════════════════════════
//  SEARCH STATE
// ══════════════════════════════════════════════════════════════════
let searchActive = false;

// ══════════════════════════════════════════════════════════════════
//  DATA HELPERS
// ══════════════════════════════════════════════════════════════════
function getDailyEntries(year, season) {
  if (NO_DATA_ZONES.has(`${year}-${season}`)) return [];
  let entries = [];
  const pushMonth = (yr, m) => {
    const yd = RAW[yr]; if (!yd || !yd[m]) return;
    yd[m].forEach((v, i) => {
      if (v != null && !isNaN(v))
        entries.push({ aqi: v, label: `${MONTH_NAMES[m]}_${String(i+1).padStart(2,'0')}` });
    });
  };
  if (season === 'winter') {
    if (year === 2023) { pushMonth(2023,10); pushMonth(2023,11); }
    else { pushMonth(year-1,11); pushMonth(year,0); pushMonth(year,1); }
  } else {
    (SEASON_MONTHS[season]||[]).forEach(m => pushMonth(year, m));
  }
  return entries;
}

function getSeasonStats(season) {
  let all = [];
  [2023,2024,2025].forEach(yr => {
    getDailyEntries(yr, season).forEach(e => all.push({ ...e, year: yr }));
  });
  if (!all.length) return { min:null, max:null, avg:null };
  all.sort((a,b)=>a.aqi-b.aqi);
  const avg = all.reduce((s,e)=>s+e.aqi,0)/all.length;
  return { min: all[0], max: all[all.length-1], avg: avg.toFixed(1) };
}

function aqiCategory(v) {
  if (v<=50)  return { cat:'GOOD',        color:'#50c850', rgb:'80,200,80',    cat_rgb:'80,200,80' };
  if (v<=100) return { cat:'SATISFACTORY',color:'#90ee90', rgb:'144,238,144',  cat_rgb:'144,238,144' };
  if (v<=200) return { cat:'MODERATE',    color:'#ffe020', rgb:'255,224,32',   cat_rgb:'255,224,32' };
  if (v<=300) return { cat:'POOR',        color:'#ff9620', rgb:'255,150,32',   cat_rgb:'255,150,32' };
  if (v<=400) return { cat:'VERY POOR',   color:'#dc3232', rgb:'220,50,50',    cat_rgb:'220,50,50' };
  return              { cat:'SEVERE',     color:'#8b0000', rgb:'139,0,0',      cat_rgb:'139,0,0' };
}


// ══════════════════════════════════════════════════════════════════
//  WIND SPEED DATA  (daily, from CSV — matched to AQI particles)
// ══════════════════════════════════════════════════════════════════
const WIND_DATA = {
  "2023-7-1": 10.33, "2023-7-2": 10.9, "2023-7-3": 8.92, "2023-7-4": 5.14, "2023-7-5": 8.72,
  "2023-7-6": 3.55, "2023-7-7": 4.8, "2023-7-8": 4.96, "2023-7-9": 4.23, "2023-7-10": 4.19,
  "2023-7-11": 7.01, "2023-7-12": 7.36, "2023-7-13": 5.43, "2023-7-14": 5.33, "2023-7-15": 7.72,
  "2023-7-16": 5.48, "2023-7-17": 5.21, "2023-7-18": 6.2, "2023-7-19": 9.66, "2023-7-20": 4.88,
  "2023-7-21": 5.36, "2023-7-22": 7.04, "2023-7-23": 7.82, "2023-7-24": 7.64, "2023-7-25": 11.66,
  "2023-7-26": 8.03, "2023-7-27": 10.26, "2023-7-28": 7.76, "2023-7-29": 8.85, "2023-7-30": 11.49,
  "2023-7-31": 9.16, "2023-8-1": 13.68, "2023-8-2": 18.21, "2023-8-3": 16.67, "2023-8-4": 4.84,
  "2023-8-5": 7.6, "2023-8-6": 17.41, "2023-8-7": 9.64, "2023-8-8": 6.9, "2023-8-9": 7.68,
  "2023-8-10": 4.56, "2023-8-11": 2.61, "2023-8-12": 5.63, "2023-8-13": 3.08, "2023-8-14": 3.56,
  "2023-8-15": 6.04, "2023-8-16": 4.87, "2023-8-17": 4.62, "2023-8-18": 4.74, "2023-8-19": 6.6,
  "2023-8-20": 5.52, "2023-8-21": 4.81, "2023-8-22": 5.55, "2023-8-23": 6.2, "2023-8-24": 4.63,
  "2023-8-25": 7.75, "2023-8-26": 4.88, "2023-8-27": 4.02, "2023-8-28": 6.25, "2023-8-29": 4.46,
  "2023-8-30": 6.49, "2023-8-31": 5.85, "2023-9-1": 7.1, "2023-9-2": 4.38, "2023-9-3": 5.75,
  "2023-9-4": 6.71, "2023-9-5": 5.4, "2023-9-6": 4.24, "2023-9-7": 3.38, "2023-9-8": 4.17,
  "2023-9-9": 3.29, "2023-9-10": 3.02, "2023-9-11": 2.98, "2023-9-12": 5.67, "2023-9-13": 3.97,
  "2023-9-14": 5.71, "2023-9-15": 5.06, "2023-9-16": 4.07, "2023-9-17": 4.2, "2023-9-18": 10.15,
  "2023-9-19": 9.0, "2023-9-20": 6.49, "2023-9-21": 6.98, "2023-9-22": 8.92, "2023-9-23": 5.8,
  "2023-9-24": 6.5, "2023-9-25": 3.47, "2023-9-26": 3.68, "2023-9-27": 4.12, "2023-9-28": 4.09,
  "2023-9-29": 8.66, "2023-9-30": 4.11, "2023-10-1": 3.31, "2023-10-2": 5.88, "2023-10-3": 10.91,
  "2023-10-4": 4.28, "2023-10-5": 3.22, "2023-10-6": 2.25, "2023-10-7": 4.15, "2023-10-8": 3.13,
  "2023-10-9": 5.14, "2023-10-10": 3.65, "2023-10-11": 5.73, "2023-10-12": 8.53, "2023-10-13": 10.62,
  "2023-10-14": 13.32, "2023-10-15": 7.25, "2023-10-16": 7.1, "2023-10-17": 5.63, "2023-10-18": 6.25,
  "2023-10-19": 6.61, "2023-10-20": 9.74, "2023-10-21": 11.37, "2023-10-22": 6.11, "2023-10-23": 4.83,
  "2023-10-24": 5.32, "2023-10-25": 14.01, "2023-10-26": 9.11, "2023-10-27": 14.66, "2023-10-28": 11.58,
  "2023-10-29": 6.88, "2023-10-30": 6.91, "2023-10-31": 12.59, "2023-11-1": 9.91, "2023-11-2": 12.13,
  "2023-11-3": 9.69, "2023-11-4": 14.85, "2023-11-5": 22.95, "2023-11-6": 12.53, "2023-11-7": 9.84,
  "2023-11-8": 8.69, "2023-11-9": 12.74, "2023-11-10": 15.83, "2023-11-11": 11.59, "2023-11-12": 10.2,
  "2023-11-13": 21.95, "2023-11-14": 16.3, "2023-11-15": 13.0, "2023-11-16": 13.51, "2023-11-17": 11.62,
  "2023-11-18": 7.59, "2023-11-19": 16.58, "2023-11-20": 14.03, "2023-11-21": 7.8, "2023-11-22": 9.8,
  "2023-11-23": 5.09, "2023-11-24": 14.52, "2023-11-25": 11.36, "2023-11-26": 7.59, "2023-11-27": 10.97,
  "2023-11-28": 12.08, "2023-11-29": 6.67, "2023-11-30": 4.23, "2023-12-1": 4.03, "2023-12-2": 8.26,
  "2023-12-3": 5.55, "2023-12-4": 8.79, "2023-12-5": 16.15, "2023-12-6": 8.01, "2023-12-7": 6.22,
  "2023-12-8": 7.28, "2023-12-9": 13.76, "2023-12-10": 17.65, "2023-12-11": 13.48, "2023-12-12": 11.29,
  "2023-12-13": 9.7, "2023-12-14": 7.34, "2023-12-15": 3.67, "2023-12-16": 3.03, "2023-12-17": 5.11,
  "2023-12-18": 5.72, "2023-12-19": 6.95, "2023-12-20": 11.5, "2023-12-21": 23.54, "2023-12-22": 22.8,
  "2023-12-23": 21.0, "2023-12-24": 18.35, "2023-12-25": 12.79, "2023-12-26": 9.02, "2023-12-27": 6.79,
  "2023-12-28": 8.04, "2023-12-29": 11.07, "2023-12-30": 7.93, "2023-12-31": 10.86,
  "2024-1-1": 12.97, "2024-1-2": 23.86, "2024-1-3": 24.52, "2024-1-4": 15.37, "2024-1-5": 5.86,
  "2024-1-6": 4.92, "2024-1-7": 13.26, "2024-1-8": 13.38, "2024-1-9": 6.53, "2024-1-10": 4.32,
  "2024-1-11": 5.49, "2024-1-12": 4.71, "2024-1-13": 4.68, "2024-1-14": 6.83, "2024-1-15": 9.1,
  "2024-1-16": 4.47, "2024-1-17": 11.01, "2024-1-18": 13.88, "2024-1-19": 6.33, "2024-1-20": 5.75,
  "2024-1-21": 8.29, "2024-1-22": 17.11, "2024-1-23": 13.62, "2024-1-24": 18.25, "2024-1-25": 5.14,
  "2024-1-26": 8.82, "2024-1-27": 4.74, "2024-1-28": 6.3, "2024-1-29": 6.22, "2024-1-30": 5.74,
  "2024-1-31": 5.12, "2024-2-1": 6.56, "2024-2-2": 6.48, "2024-2-3": 6.57, "2024-2-4": 8.06,
  "2024-2-5": 7.18, "2024-2-6": 9.45, "2024-2-7": 17.93, "2024-2-8": 14.29, "2024-2-9": 7.67,
  "2024-2-10": 6.01, "2024-2-11": 14.22, "2024-2-12": 7.53, "2024-2-13": 4.62, "2024-2-14": 5.98,
  "2024-2-15": 6.07, "2024-2-16": 6.19, "2024-2-17": 5.12, "2024-2-18": 6.67, "2024-2-19": 8.69,
  "2024-2-20": 4.94, "2024-2-21": 8.36, "2024-2-22": 21.79, "2024-2-23": 10.92, "2024-2-24": 9.34,
  "2024-2-25": 7.94, "2024-2-26": 5.42, "2024-2-27": 10.62, "2024-2-28": 7.1, "2024-2-29": 3.02,
  "2024-3-1": 7.19, "2024-3-2": 6.38, "2024-3-3": 6.34, "2024-3-4": 4.32, "2024-3-5": 6.59,
  "2024-3-6": 4.65, "2024-3-7": 5.34, "2024-3-8": 6.3, "2024-3-9": 6.1, "2024-3-10": 6.2,
  "2024-3-11": 6.82, "2024-3-12": 10.19, "2024-3-13": 8.71, "2024-3-14": 5.85, "2024-3-15": 10.88,
  "2024-3-16": 11.5, "2024-3-17": 4.31, "2024-3-18": 4.64, "2024-3-19": 3.33, "2024-3-20": 3.68,
  "2024-3-21": 6.86, "2024-3-22": 6.09, "2024-3-23": 16.2, "2024-3-24": 14.89, "2024-3-25": 6.82,
  "2024-3-26": 4.71, "2024-3-27": 8.92, "2024-3-28": 13.01, "2024-3-29": 5.87, "2024-3-30": 7.05,
  "2024-3-31": 4.86, "2024-4-1": 11.59, "2024-4-2": 13.15, "2024-4-3": 12.67, "2024-4-4": 12.41,
  "2024-4-5": 7.65, "2024-4-6": 8.09, "2024-4-7": 4.91, "2024-4-8": 4.79, "2024-4-9": 12.17,
  "2024-4-10": 7.16, "2024-4-11": 4.01, "2024-4-12": 2.84, "2024-4-13": 4.28, "2024-4-14": 6.0,
  "2024-4-15": 14.11, "2024-4-16": 18.27, "2024-4-17": 10.65, "2024-4-18": 6.7, "2024-4-19": 14.57,
  "2024-4-20": 7.5, "2024-4-21": 7.34, "2024-4-22": 11.31, "2024-4-23": 9.36, "2024-4-24": 9.49,
  "2024-4-25": 6.72, "2024-4-26": 7.49, "2024-4-27": 7.23, "2024-4-28": 6.25, "2024-4-29": 5.58,
  "2024-4-30": 4.98, "2024-5-1": 4.79, "2024-5-2": 10.29, "2024-5-3": 9.77, "2024-5-4": 6.87,
  "2024-5-5": 9.3, "2024-5-6": 7.93, "2024-5-7": 5.51, "2024-5-8": 9.26, "2024-5-9": 7.93,
  "2024-5-10": 5.93, "2024-5-11": 5.08, "2024-5-12": 5.11, "2024-5-13": 4.75, "2024-5-14": 6.8,
  "2024-5-15": 4.25, "2024-5-16": 6.08, "2024-5-17": 10.43, "2024-5-18": 4.51, "2024-5-19": 5.16,
  "2024-5-20": 5.01, "2024-5-21": 6.16, "2024-5-22": 9.24, "2024-5-23": 3.9, "2024-5-24": 3.7,
  "2024-5-25": 3.57, "2024-5-26": 5.94, "2024-5-27": 5.56, "2024-5-28": 4.52, "2024-5-29": 6.54,
  "2024-5-30": 8.86, "2024-5-31": 6.58, "2024-6-1": 4.87, "2024-6-2": 4.51, "2024-6-3": 7.12,
  "2024-6-4": 2.66, "2024-6-5": 6.18, "2024-6-6": 5.52, "2024-6-7": 3.99, "2024-6-8": 3.51,
  "2024-6-9": 6.51, "2024-6-10": 10.2, "2024-6-11": 5.78, "2024-6-12": 6.11, "2024-6-13": 4.17,
  "2024-6-14": 7.9, "2024-6-15": 11.29, "2024-6-16": 7.7, "2024-6-17": 5.33, "2024-6-18": 4.26,
  "2024-6-19": 6.5, "2024-6-20": 5.27, "2024-6-21": 7.47, "2024-6-22": 6.4, "2024-6-23": 7.04,
  "2024-6-24": 10.69, "2024-6-25": 7.4, "2024-6-26": 5.44, "2024-6-27": 7.17, "2024-6-28": 4.69,
  "2024-6-29": 5.66, "2024-6-30": 9.71, "2024-7-1": 6.27, "2024-7-2": 6.3, "2024-7-3": 6.5,
  "2024-7-4": 12.16, "2024-7-5": 4.42, "2024-7-6": 8.47, "2024-7-7": 3.53, "2024-7-8": 3.78,
  "2024-7-9": 6.01, "2024-7-10": 4.48, "2024-7-11": 2.58, "2024-7-12": 8.79, "2024-7-13": 5.02,
  "2024-7-14": 2.83, "2024-7-15": 5.26, "2024-7-16": 8.13, "2024-7-17": 4.3, "2024-7-18": 6.07,
  "2024-7-19": 3.32, "2024-7-20": 3.46, "2024-7-21": 6.55, "2024-7-22": 6.54, "2024-7-23": 7.28,
  "2024-7-24": 6.16, "2024-7-25": 4.28, "2024-7-26": 3.49, "2024-7-27": 3.56, "2024-7-28": 8.2,
  "2024-7-29": 5.79, "2024-7-30": 4.33, "2024-7-31": 3.72, "2024-8-1": 6.53, "2024-8-2": 4.02,
  "2024-8-3": 5.54, "2024-8-4": 5.04, "2024-8-5": 4.23, "2024-8-6": 2.95, "2024-8-7": 5.51,
  "2024-8-8": 5.01, "2024-8-9": 4.72, "2024-8-10": 3.97, "2024-8-11": 6.2, "2024-8-12": 3.86,
  "2024-8-13": 4.54, "2024-8-14": 5.32, "2024-8-15": 5.82, "2024-8-16": 4.32, "2024-8-17": 3.35,
  "2024-8-18": 6.1, "2024-8-19": 6.66, "2024-8-20": 2.73, "2024-8-21": 7.45, "2024-8-22": 3.24,
  "2024-8-23": 6.55, "2024-8-24": 7.97, "2024-8-25": 5.81, "2024-8-26": 6.51, "2024-8-27": 6.67,
  "2024-8-28": 4.85, "2024-8-29": 4.3, "2024-8-30": 4.83, "2024-8-31": 4.99, "2024-9-1": 3.76,
  "2024-9-2": 4.0, "2024-9-3": 3.65, "2024-9-4": 4.03, "2024-9-5": 7.84, "2024-9-6": 3.83,
  "2024-9-7": 4.85, "2024-9-8": 4.51, "2024-9-9": 12.64, "2024-9-10": 9.88, "2024-9-11": 10.83,
  "2024-9-12": 5.6, "2024-9-13": 7.38, "2024-9-14": 8.19, "2024-9-15": 7.86, "2024-9-16": 3.93,
  "2024-9-17": 11.44, "2024-9-18": 10.06, "2024-9-19": 4.76, "2024-9-20": 4.86, "2024-9-21": 4.04,
  "2024-9-22": 3.75, "2024-9-23": 5.28, "2024-9-24": 10.88, "2024-9-25": 10.61, "2024-9-26": 17.07,
  "2024-9-27": 14.96, "2024-9-28": 7.78, "2024-9-29": 7.41, "2024-9-30": 9.83, "2024-10-1": 7.33,
  "2024-10-2": 4.49, "2024-10-3": 11.83, "2024-10-4": 11.24, "2024-10-5": 6.71, "2024-10-6": 7.37,
  "2024-10-7": 6.42, "2024-10-8": 5.85, "2024-10-9": 9.45, "2024-10-10": 15.2, "2024-10-11": 6.6,
  "2024-10-12": 8.85, "2024-10-13": 9.21, "2024-10-14": 7.31, "2024-10-15": 5.93, "2024-10-16": 4.57,
  "2024-10-17": 5.16, "2024-10-18": 6.29, "2024-10-19": 4.91, "2024-10-20": 4.17, "2024-10-21": 5.83,
  "2024-10-22": 5.18, "2024-10-23": 6.94, "2024-10-24": 5.47, "2024-10-25": 5.35, "2024-10-26": 4.06,
  "2024-10-27": 4.07, "2024-10-28": 4.23, "2024-10-29": 3.96, "2024-10-30": 4.11, "2024-10-31": 3.73,
  "2024-11-1": 4.73, "2024-11-2": 4.32, "2024-11-3": 4.57, "2024-11-4": 4.92, "2024-11-5": 5.25,
  "2024-11-6": 4.27, "2024-11-7": 3.1, "2024-11-8": 4.24, "2024-11-9": 4.32, "2024-11-10": 3.96,
  "2024-11-11": 3.46, "2024-11-12": 9.11, "2024-11-13": 6.24, "2024-11-14": 2.99, "2024-11-15": 3.09,
  "2024-11-16": 5.16, "2024-11-17": 7.18, "2024-11-18": 12.87, "2024-11-19": 23.91, "2024-11-20": 13.55,
  "2024-11-21": 9.83, "2024-11-22": 12.58, "2024-11-23": 8.66, "2024-11-24": 9.89, "2024-11-25": 8.41,
  "2024-11-26": 6.82, "2024-11-27": 8.37, "2024-11-28": 8.64, "2024-11-29": 5.85, "2024-11-30": 5.07,
  "2024-12-1": 6.0, "2024-12-2": 6.88, "2024-12-3": 6.17, "2024-12-4": 3.96, "2024-12-5": 8.41,
  "2024-12-6": 16.17, "2024-12-7": 12.28, "2024-12-8": 8.04, "2024-12-9": 13.71, "2024-12-10": 10.43,
  "2024-12-11": 4.67, "2024-12-12": 3.2, "2024-12-13": 4.8, "2024-12-14": 6.7, "2024-12-15": 7.8,
  "2024-12-16": 6.94, "2024-12-17": 5.88, "2024-12-18": 7.58, "2024-12-19": 15.0, "2024-12-20": 8.3,
  "2024-12-21": 13.2, "2024-12-22": 18.3, "2024-12-23": 9.67, "2024-12-24": 3.12, "2024-12-25": 4.24,
  "2024-12-26": 5.06, "2024-12-27": 5.52, "2024-12-28": 5.14, "2024-12-29": 4.44, "2024-12-30": 3.69,
  "2024-12-31": 6.13, "2025-1-1": 8.79, "2025-1-2": 15.5, "2025-1-3": 5.46, "2025-1-4": 6.05,
  "2025-1-5": 10.24, "2025-1-6": 12.87, "2025-1-7": 13.69, "2025-1-8": 11.19, "2025-1-9": 19.36,
  "2025-1-10": 5.4, "2025-1-11": 6.51, "2025-1-12": 7.79, "2025-1-13": 7.6, "2025-1-14": 3.4,
  "2025-1-15": 4.81, "2025-1-16": 5.52, "2025-1-17": 4.23, "2025-1-18": 4.33, "2025-1-19": 4.52,
  "2025-1-20": 3.76, "2025-1-21": 4.53, "2025-1-22": 7.09, "2025-1-23": 10.38, "2025-1-24": 8.14,
  "2025-1-25": 7.05, "2025-1-26": 13.78, "2025-1-27": 12.7, "2025-1-28": 13.51, "2025-1-29": 14.58,
  "2025-1-30": 5.11, "2025-1-31": 6.76, "2025-2-1": 5.76, "2025-2-2": 2.71, "2025-2-3": 2.5,
  "2025-2-4": 2.94, "2025-2-5": 4.45, "2025-2-6": 6.85, "2025-2-7": 5.15, "2025-2-8": 4.84,
  "2025-2-9": 3.97, "2025-2-10": 6.41, "2025-2-11": 6.59, "2025-2-12": 6.55, "2025-2-13": 5.65,
  "2025-2-14": 8.62, "2025-2-15": 5.51, "2025-2-16": 4.96, "2025-2-17": 4.71, "2025-2-18": 6.3,
  "2025-2-19": 6.24, "2025-2-20": 6.26, "2025-2-21": 5.88, "2025-2-22": 5.89, "2025-2-23": 3.99,
  "2025-2-24": 6.72, "2025-2-25": 9.72, "2025-2-26": 13.78, "2025-2-27": 8.52, "2025-2-28": 6.31,
  "2025-3-1": 12.07, "2025-3-2": 7.42, "2025-3-3": 3.44, "2025-3-4": 3.49, "2025-3-5": 3.88,
  "2025-3-6": 3.37, "2025-3-7": 3.45, "2025-3-8": 5.07, "2025-3-9": 5.21, "2025-3-10": 5.18,
  "2025-3-11": 3.2, "2025-3-12": 3.53, "2025-3-13": 6.9, "2025-3-14": 8.77, "2025-3-15": 11.75,
  "2025-3-16": 6.19, "2025-3-17": 9.21, "2025-3-18": 6.09, "2025-3-19": 4.17, "2025-3-20": 5.2,
  "2025-3-21": 7.31, "2025-3-22": 5.4, "2025-3-23": 5.73, "2025-3-24": 3.48, "2025-3-25": 4.23,
  "2025-3-26": 6.93, "2025-3-27": 9.81, "2025-3-28": 3.93, "2025-3-29": 9.7, "2025-3-30": 8.53,
  "2025-3-31": 9.35, "2025-4-1": 17.44, "2025-4-2": 9.09, "2025-4-3": 5.07, "2025-4-4": 4.8,
  "2025-4-5": 5.28, "2025-4-6": 10.48, "2025-4-7": 6.8, "2025-4-8": 5.19, "2025-4-9": 6.86,
  "2025-4-10": 6.32, "2025-4-11": 4.56, "2025-4-12": 4.86, "2025-4-13": 7.63, "2025-4-14": 4.56,
  "2025-4-15": 4.11, "2025-4-16": 6.54, "2025-4-17": 8.59, "2025-4-18": 5.52, "2025-4-19": 5.62,
  "2025-4-20": 6.22, "2025-4-21": 8.47, "2025-4-22": 4.4, "2025-4-23": 5.01, "2025-4-24": 8.27,
  "2025-4-25": 7.24, "2025-4-26": 8.84, "2025-4-27": 5.68, "2025-4-28": 6.88, "2025-4-29": 6.58,
  "2025-4-30": 4.74, "2025-5-1": 3.46, "2025-5-2": 4.61, "2025-5-3": 8.02, "2025-5-4": 8.26,
  "2025-5-5": 12.18, "2025-5-6": 12.87, "2025-5-7": 9.81, "2025-5-8": 8.03, "2025-5-9": 9.67,
  "2025-5-10": 4.77, "2025-5-11": 6.48, "2025-5-12": 6.27, "2025-5-13": 2.87, "2025-5-14": 3.58,
  "2025-5-15": 8.79, "2025-5-16": 8.09, "2025-5-17": 4.06, "2025-5-18": 4.74, "2025-5-19": 4.84,
  "2025-5-20": 4.05, "2025-5-21": 5.32, "2025-5-22": 6.65, "2025-5-23": 6.22, "2025-5-24": 4.99,
  "2025-5-25": 10.4, "2025-5-26": 6.36, "2025-5-27": 7.2, "2025-5-28": 11.25, "2025-5-29": 5.19,
  "2025-5-30": 3.09, "2025-5-31": 4.43, "2025-6-1": 6.72, "2025-6-2": 4.94, "2025-6-3": 5.4,
  "2025-6-4": 5.34, "2025-6-5": 6.67, "2025-6-6": 10.45, "2025-6-7": 9.11, "2025-6-8": 14.39,
  "2025-6-9": 3.62, "2025-6-10": 6.1, "2025-6-11": 6.29, "2025-6-12": 4.62, "2025-6-13": 5.48,
  "2025-6-14": 5.65, "2025-6-15": 6.76, "2025-6-16": 8.52, "2025-6-17": 8.47, "2025-6-18": 5.07,
  "2025-6-19": 7.98, "2025-6-20": 8.67, "2025-6-21": 4.75, "2025-6-22": 6.55, "2025-6-23": 11.17,
  "2025-6-24": 7.59, "2025-6-25": 4.17, "2025-6-26": 10.0, "2025-6-27": 7.05, "2025-6-28": 3.39,
  "2025-6-29": 8.27, "2025-6-30": 5.77, "2025-7-1": 4.55, "2025-7-2": 4.91, "2025-7-3": 7.92,
  "2025-7-4": 7.3, "2025-7-5": 4.8, "2025-7-6": 8.47, "2025-7-7": 10.94, "2025-7-8": 8.99,
  "2025-7-9": 5.37, "2025-7-10": 5.92, "2025-7-11": 6.19, "2025-7-12": 5.26, "2025-7-13": 6.65,
  "2025-7-14": 7.77, "2025-7-15": 9.49, "2025-7-16": 10.37, "2025-7-17": 4.49, "2025-7-18": 4.74,
  "2025-7-19": 6.73, "2025-7-20": 5.64, "2025-7-21": 8.3, "2025-7-22": 12.14, "2025-7-23": 5.44,
  "2025-7-24": 3.24, "2025-7-25": 4.2, "2025-7-26": 3.66, "2025-7-27": 7.37, "2025-7-28": 7.33,
  "2025-7-29": 3.85, "2025-7-30": 5.1, "2025-7-31": 5.01, "2025-8-1": 6.19, "2025-8-2": 4.7,
  "2025-8-3": 4.74, "2025-8-4": 5.97, "2025-8-5": 7.87, "2025-8-6": 7.68, "2025-8-7": 3.93,
  "2025-8-8": 4.32, "2025-8-9": 4.9, "2025-8-10": 9.04, "2025-8-11": 7.69, "2025-8-12": 3.93,
  "2025-8-13": 4.68, "2025-8-14": 6.21, "2025-8-15": 3.29, "2025-8-16": 5.89, "2025-8-17": 9.06,
  "2025-8-18": 7.16, "2025-8-19": 5.22, "2025-8-20": 3.95, "2025-8-21": 5.19, "2025-8-22": 6.88,
  "2025-8-23": 5.53, "2025-8-24": 5.97, "2025-8-25": 3.56, "2025-8-26": 5.43, "2025-8-27": 5.57,
  "2025-8-28": 5.8, "2025-8-29": 8.17, "2025-8-30": 7.46, "2025-8-31": 6.22, "2025-9-1": 4.34,
  "2025-9-2": 6.95, "2025-9-3": 8.34, "2025-9-4": 5.11, "2025-9-5": 6.1, "2025-9-6": 6.62,
  "2025-9-7": 5.88, "2025-9-8": 3.29, "2025-9-9": 6.78, "2025-9-10": 3.79, "2025-9-11": 12.17,
  "2025-9-12": 7.4, "2025-9-13": 7.31, "2025-9-14": 9.68, "2025-9-15": 15.82, "2025-9-16": 11.3,
  "2025-9-17": 5.21, "2025-9-18": 3.72, "2025-9-19": 4.65, "2025-9-20": 5.82, "2025-9-21": 7.3,
  "2025-9-22": 11.53, "2025-9-23": 7.8, "2025-9-24": 6.75, "2025-9-25": 4.39, "2025-9-26": 3.3,
  "2025-9-27": 3.36, "2025-9-28": 4.24, "2025-9-29": 3.09, "2025-9-30": 3.65, "2025-10-1": 7.13,
  "2025-10-2": 6.09, "2025-10-3": 5.33, "2025-10-4": 15.42, "2025-10-5": 14.45, "2025-10-6": 6.39,
  "2025-10-7": 4.65, "2025-10-8": 2.88, "2025-10-9": 5.71, "2025-10-10": 6.84, "2025-10-11": 5.16,
  "2025-10-12": 4.7, "2025-10-13": 5.8, "2025-10-14": 5.37, "2025-10-15": 7.38, "2025-10-16": 5.74,
  "2025-10-17": 4.99, "2025-10-18": 5.66, "2025-10-19": 6.89, "2025-10-20": 8.73, "2025-10-21": 9.9,
  "2025-10-22": 8.41, "2025-10-23": 21.47, "2025-10-24": 16.25, "2025-10-25": 12.43, "2025-10-26": 15.48,
  "2025-10-27": 20.16, "2025-10-28": 12.71, "2025-10-29": 7.07, "2025-10-30": 6.14, "2025-10-31": 6.1,
  "2025-11-1": 6.74, "2025-11-2": 8.52, "2025-11-3": 6.51, "2025-11-4": 6.16, "2025-11-5": 5.76,
  "2025-11-6": 4.39, "2025-11-7": 3.29, "2025-11-8": 3.67, "2025-11-9": 2.98, "2025-11-10": 4.96,
  "2025-11-11": 5.96, "2025-11-12": 7.07, "2025-11-13": 6.41, "2025-11-14": 7.09, "2025-11-15": 4.23,
  "2025-11-16": 4.38, "2025-11-17": 7.05, "2025-11-18": 4.66, "2025-11-19": 8.32, "2025-11-20": 9.11,
  "2025-11-21": 7.3, "2025-11-22": 3.92, "2025-11-23": 7.7, "2025-11-24": 7.02, "2025-11-25": 7.78,
  "2025-11-26": 5.93, "2025-11-27": 3.42, "2025-11-28": 6.06, "2025-11-29": 6.84, "2025-11-30": 6.08
};

// Helper: get wind speed for a particle label + year
function getWindSpeed(label, year) {
  const parts = label.split('_');
  const monthName = parts[0];
  const day = parseInt(parts[1]);
  const monthIdx = MONTH_NAMES.indexOf(monthName);
  if (monthIdx < 0) return null;
  const month = monthIdx + 1;
  const key = `${year}-${month}-${day}`;
  const v = WIND_DATA[key];
  return (v !== undefined) ? v : null;
}

// ══════════════════════════════════════════════════════════════════
//  p5 GLOBALS
// ══════════════════════════════════════════════════════════════════
const PAD   = 16;
const BADGE = 74;
const ZONE_GAP = 10;           // vertical gap between year zones (visual separation)
const BADGE_RESERVE = 116;     // horizontal exclusion on the right for year-info badges
let canvasW, canvasH, zoneH, zones = {};
let sys2025, sys2024, sys2023;
let activeSeason = 'all';
// Frozen state — toggled by clicking a season section
const frozen = { 2025:false, 2024:false, 2023:false };
// Note: 2023 starts unfrozen so particles float like other sections
let hoveredParticle = null;

// ══════════════════════════════════════════════════════════════════
//  p5 SETUP / DRAW
// ══════════════════════════════════════════════════════════════════
function setup() {
  const wrap = document.getElementById('viz-wrap');
  canvasW = wrap.offsetWidth;
  canvasH = wrap.offsetHeight;
  const cnv = createCanvas(canvasW, canvasH);
  cnv.parent('viz-wrap');
  colorMode(RGB,255,255,255,1);
  textFont('Manrope');
  computeLayout();
  buildSystems();
}

function draw() {
  background(16,16,21);
  updateRingGeometry();       // circular presentation of the three year systems
  drawRingBackgrounds();
  drawSeasonAmbience();       // decorative weather layer, behind particles

  // Particles are simulated in their original (logical) zones exactly as
  // before and only *drawn* projected into each year's ring.
  RING.hits = [];
  runProjected(sys2025, RING.cur[2025]);
  runProjected(sys2024, RING.cur[2024]);
  runProjected(sys2023, RING.cur[2023]);

  drawRingLabels();
}

function computeLayout() {
  const usable = canvasH - PAD*2 - ZONE_GAP*2;
  zoneH = floor(usable / 3);
  zones.top = PAD;
  zones.mid = PAD + zoneH + ZONE_GAP;
  zones.bot = PAD + zoneH*2 + ZONE_GAP*2;
}

// ══════════════════════════════════════════════════════════════════
//  RING VIEW — presentation layer for the particle visualisation
//  ──────────────────────────────────────────────────────────────────
//  Each year's particle system still lives in its rectangular logical
//  zone (zones.top / mid / bot) — generation, motion, wind behaviour,
//  freezing and hover hit-testing are unchanged. This layer maps a
//  particle's normalised zone position (u = across, v = down) onto a
//  ring:  u → angle around the centre,  v → radius (area-preserving).
//  Single view: only the focused year, as one full circle.
//  Compare view: the selected years share one circle as arc segments
//  separated by constant-width gaps (one selected year = full circle).
//  Hidden years collapse into the centre and fade out.
// ══════════════════════════════════════════════════════════════════
const VIEW = { year:2025, compare:false, years:[2025] };   // set by year nav / compare chips
const RING = { cur:null, from:null, key:null, start:0, progress:1, bottom:null };
const YEARS = [2023, 2024, 2025];
const RING_TOP      = 40;     // space above the circle (hint line)
const RING_CTRL     = 136;    // space below the circle for year nav + Compare + chips
const RING_TAG      = 30;     // room for the year tags outside compare arcs
const RING_SIDE     = 16;
const RING_INNER    = 0.34;   // centre-circle radius as a share of the ring radius
const RING_GAP_PX   = 16;     // constant-width channel between compare arcs
const RING_MORPH_MS = 700;
const PART_IN = 8, PART_OUT = 6;   // keep particle centres off the ring edges
const TAU = Math.PI * 2;

// Desktop only: year nav + Compare move into a rail to the right of the
// circle so the circle can use the full height. Tablet / mobile keep the
// controls underneath.
const RAIL_W = 160, RAIL_GAP = 48;
const _desktopMQ = window.matchMedia('(min-width: 1025px)');

// Shared centre + sizes so single ↔ compare morphs happen in place
function _ringFrame() {
  const W = canvasW, H = canvasH;
  if (_desktopMQ.matches) {
    const availH = H - RING_TOP - 16;
    const dSingle  = Math.max(120, Math.min(W - RING_SIDE*2 - RAIL_W - RAIL_GAP, availH - 8, 800));
    const dCompare = Math.max(120, Math.min(dSingle - RING_TAG*2, 760));
    const x0 = (W - (dSingle + RAIL_GAP + RAIL_W)) / 2;          // circle + rail centred as one group
    return { side:true, cx: x0 + dSingle/2, cy: RING_TOP + availH/2, dSingle, dCompare,
             railLeft: x0 + dSingle + RAIL_GAP };
  }
  const availH = H - RING_TOP - RING_CTRL;
  const dSingle  = Math.max(120, Math.min(W - RING_SIDE*2, availH - 8, 660));
  const dCompare = Math.max(120, Math.min(W - RING_SIDE*2 - RING_TAG*2, availH - 8 - RING_TAG*2, 620));
  return { side:false, cx: W/2, cy: RING_TOP + availH/2, dSingle, dCompare, railLeft: 0 };
}

function _collapsed(f, rIn) {
  return { cx:f.cx, cy:f.cy, rOut:rIn*1.05, rIn, a0:-Math.PI/2, a1:Math.PI*1.5, gap:0, alpha:0 };
}

function _singleGeoms() {
  const f = _ringFrame(), rOut = f.dSingle/2, rIn = _innerR(rOut), g = {};
  YEARS.forEach(yr => g[yr] = yr === VIEW.year
    ? { cx:f.cx, cy:f.cy, rOut, rIn, a0:-Math.PI/2, a1:Math.PI*1.5, gap:0, alpha:1 }
    : _collapsed(f, rIn));
  return g;
}

function _compareGeoms() {
  const f = _ringFrame(), rOut = f.dCompare/2, rIn = _innerR(rOut);
  const sel = YEARS.filter(y => VIEW.years.includes(y));
  const k = Math.max(1, sel.length), span = TAU / k;
  const start = k === 3 ? Math.PI*5/6 : k === 2 ? Math.PI/2 : -Math.PI/2;   // 2: left | right · 3: two top, one bottom
  const g = {};
  YEARS.forEach(yr => {
    const i = sel.indexOf(yr);
    g[yr] = i < 0 ? _collapsed(f, rIn)
      : { cx:f.cx, cy:f.cy, rOut, rIn, a0:start + i*span, a1:start + (i+1)*span,
          gap: k > 1 ? RING_GAP_PX : 0, alpha:1 };
  });
  return g;
}

function updateRingGeometry() {
  const sizeKey = `${canvasW}x${canvasH}`;
  const key = `${VIEW.compare}|${VIEW.year}|${VIEW.years.join(',')}|${sizeKey}`;
  const target = VIEW.compare ? _compareGeoms() : _singleGeoms();
  if (RING.key === null) {
    RING.from = target; RING.start = 0;
  } else if (RING.key !== key) {
    const resized = RING.key.split('|')[3] !== sizeKey;
    RING.from = resized ? target : RING.cur;
    RING.start = resized ? 0 : performance.now();
  }
  RING.key = key;
  let k = RING.start ? Math.min((performance.now() - RING.start) / RING_MORPH_MS, 1) : 1;
  if (_ambReduce.matches) k = 1;
  RING.progress = k;
  const e = k < 0.5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3) / 2;   // ease-in-out cubic
  RING.cur = {};
  YEARS.forEach(yr => {
    const a = RING.from[yr], b = target[yr], o = {};
    for (const p in b) o[p] = a[p] + (b[p] - a[p]) * e;
    RING.cur[yr] = o;
  });
  // Tell the HTML controls where to sit: beside the circle (desktop rail)
  // or right beneath it (tablet / mobile)
  const vis = YEARS.map(y => target[y]).find(g => g.alpha > 0.5);
  const wrap = document.getElementById('viz-wrap');
  if (vis && wrap) {
    const f = _ringFrame();
    const bottom = Math.round(vis.cy + vis.rOut + (VIEW.compare && VIEW.years.length > 1 ? RING_TAG : 0));
    const sig = `${f.side}|${bottom}|${Math.round(f.cy)}|${Math.round(f.railLeft)}`;
    if (sig !== RING.bottom) {
      RING.bottom = sig;
      wrap.dataset.ctrl = f.side ? 'side' : 'below';
      wrap.style.setProperty('--ring-bottom', bottom + 'px');
      wrap.style.setProperty('--ring-cy', Math.round(f.cy) + 'px');
      wrap.style.setProperty('--rail-left', Math.round(f.railLeft) + 'px');
    }
  }
}

// Angular bounds at radius r, leaving a constant-width channel (g.gap px)
function _arcAt(g, r) {
  const half = g.gap / 2 / Math.max(r, 1);
  return [g.a0 + half, g.a1 - half];
}
function _isFull(g) { return g.gap < 0.5 && (g.a1 - g.a0) >= TAU - 1e-3; }

function _ringProject(g, u, v) {
  const r0 = g.rIn + PART_IN, r1 = Math.max(r0 + 1, g.rOut - PART_OUT);
  const r = Math.sqrt(r0*r0 + v*(r1*r1 - r0*r0));
  const [s, t] = _arcAt(g, r);
  const th = s + u * (t - s);
  return [g.cx + r*Math.cos(th), g.cy + r*Math.sin(th)];
}

function _ringUnproject(g, x, y) {
  if (!g || g.alpha < 0.5) return null;
  const dx = x - g.cx, dy = y - g.cy, r = Math.hypot(dx, dy);
  if (r < g.rIn || r > g.rOut) return null;
  const r0 = g.rIn + PART_IN, r1 = Math.max(r0 + 1, g.rOut - PART_OUT);
  const [s, t] = _arcAt(g, r);
  let a = Math.atan2(dy, dx) - s;
  a = ((a % TAU) + TAU) % TAU;
  if (a > (t - s)) return null;
  const u = a / (t - s);
  const v = Math.min(1, Math.max(0, (r*r - r0*r0) / (r1*r1 - r0*r0)));
  return { u, v };
}

function _ringPath(ctx, g) {
  ctx.beginPath();
  if (_isFull(g)) {
    ctx.arc(g.cx, g.cy, g.rOut, 0, TAU);
    ctx.moveTo(g.cx + g.rIn, g.cy);
    ctx.arc(g.cx, g.cy, g.rIn, 0, TAU, true);
  } else {
    const [os, oe] = _arcAt(g, g.rOut), [is, ie] = _arcAt(g, g.rIn);
    ctx.arc(g.cx, g.cy, g.rOut, os, oe);
    ctx.arc(g.cx, g.cy, g.rIn, ie, is, true);
    ctx.closePath();
  }
}

// ── Speed-faithful particle projection ─────────────────────────────
// Wind speed drives each particle's drift in the unchanged update() code.
// To keep that motion truthful on screen, a particle gets a fixed "home"
// in the ring (from where it was first drawn, spread evenly by area) and
// its wind-driven movement since then is drawn with ONE uniform scale S —
// the same in every direction and at every point of the ring. Relative
// speeds between wind levels and between particles are therefore exactly
// those of the original visualisation.
const _HOME = new WeakMap();   // particle → { x, y, u, v } at first draw (presentation cache)

function _ringScale(g, sys) {
  return 1;   // particles move exactly as many pixels per frame as in the original panels
}

// Inner radius that gives the particle band at least the original zone
// height, so 1:1 motion needs no extra edge-stopping (where space allows).
function _innerR(rOut) {
  const h = (typeof zoneH === 'number' && zoneH > 0) ? zoneH - 2 : 0;
  const needed = rOut - PART_OUT - PART_IN - h;
  return Math.max(rOut * 0.24, Math.min(rOut * RING_INNER, needed));
}

// Wrap v into [0, L): movement keeps its exact 1:1 speed and nothing can
// collect at an edge — a particle leaving one side re-enters on the other.
function _wrap(v, L) {
  if (L <= 0) return 0;
  return ((v % L) + L) % L;
}
const EDGE_FADE = 14;   // px over which particles fade as they flow across an edge

function _projectParticle(g, sys, p, S) {
  const r0 = g.rIn + PART_IN, r1 = Math.max(r0 + 1, g.rOut - PART_OUT), band = r1 - r0;
  let h = _HOME.get(p);
  if (!h) {
    h = { x: p.x, y: p.y, u: Math.random(), v: Math.random() };   // random home, spread evenly by area — independent of where the particle started
    _HOME.set(p, h);
  }
  const rHome = Math.sqrt(r0*r0 + h.v * (r1*r1 - r0*r0));               // even spread by area
  // Radial: wind-driven movement × S, flowing through the ring's inner and
  // outer edges (fade out / fade in) instead of stopping or bouncing there.
  const r = r0 + _wrap(rHome - r0 + (p.y - h.y) * S, band);
  let fade = Math.min(1, Math.min(r - r0, r1 - r) / EDGE_FADE);
  const [sH, tH] = _arcAt(g, rHome);                                      // home angle fixed at the home radius
  const move = ((p.x - h.x) * S) / r;                                     // arc-length move × S
  let th;
  if (_isFull(g)) {
    th = sH + h.u * (tH - sH) + move;                                     // full circle: flows round freely
  } else {                                                                // arcs: flow through the gaps
    const [s, t] = _arcAt(g, r);
    const rel = _wrap(sH - s + h.u * (tH - sH) + move, t - s);
    th = s + rel;
    fade = Math.min(fade, Math.min(rel, (t - s) - rel) * r / EDGE_FADE);
  }
  fade = Math.max(0, Math.min(1, fade));
  return [g.cx + r*Math.cos(th), g.cy + r*Math.sin(th), fade * fade * (3 - 2 * fade)];
}

function runProjected(sys, g) {
  if (!sys) return;
  const frz = sys.isFrozen();
  const ctx = drawingContext;
  const visible = g && g.alpha > 0.01;
  const S = visible ? _ringScale(g, sys) : 1;
  if (visible) { ctx.save(); _ringPath(ctx, g); ctx.clip(); }
  for (const p of sys.particles) {           // same per-particle order as ParticleSystem.run()
    if (!frz) p.update();
    if (!visible) continue;
    const lx = p.x, ly = p.y;
    const s = _projectParticle(g, sys, p, S);
    if (s[2] <= 0.01) continue;              // fully faded at an edge crossing
    ctx.globalAlpha = g.alpha * s[2];
    p.x = s[0]; p.y = s[1];
    p.draw(frz);                             // unchanged particle rendering
    p.x = lx; p.y = ly;
    if (g.alpha > 0.5 && s[2] > 0.4) RING.hits.push({ p, x: s[0], y: s[1] });   // screen positions for hover
  }
  if (visible) ctx.restore();
}

function drawRingBackgrounds() {
  const ctx = drawingContext;
  YEARS.forEach(yr => {
    const g = RING.cur[yr];
    if (g.alpha < 0.01) return;
    ctx.save();
    ctx.globalAlpha = g.alpha;
    _ringPath(ctx, g);
    ctx.fillStyle = '#070709';
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(241,240,225,0.10)'; ctx.lineWidth = 1; ctx.stroke();
    // faint concentric guide rings
    ctx.clip('evenodd');
    ctx.strokeStyle = 'rgba(241,240,225,0.045)';
    for (const f of [0.38, 0.7]) {
      ctx.beginPath(); ctx.arc(g.cx, g.cy, g.rIn + (g.rOut - g.rIn) * f, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  });
}

function _yearInfo(yr) {
  const avg    = YEAR_SEASON_AVG[yr][activeSeason];
  const noData = NO_DATA_ZONES.has(`${yr}-${activeSeason}`);
  const days   = getDailyEntries(yr, activeSeason).length;
  return { avg, hasAvg: avg !== null && !noData, days };
}

function _catRGB(v) { const c = aqiCol(v); return [red(c), green(c), blue(c)]; }

function _setSpacing(px) { try { drawingContext.letterSpacing = px + 'px'; } catch (e) {} }

function _centreDisc(cx, cy, r) {
  const ctx = drawingContext;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
  ctx.fillStyle = '#101015'; ctx.fill();
  ctx.strokeStyle = 'rgba(241,240,225,0.14)'; ctx.lineWidth = 1; ctx.stroke();
}

// "● 76.0 AQI" centred on x
function _aqiLine(x, y, info, size) {
  if (!info.hasAvg) {
    textFont('Manrope'); textStyle(NORMAL); textSize(size * 0.6);
    fill(241,240,225,0.55); textAlign(CENTER, BASELINE); text('no data', x, y);
    return;
  }
  const [r,g,b] = _catRGB(info.avg);
  const val = info.avg.toFixed(1);
  textFont('Manrope'); textStyle(BOLD); textSize(size);
  const vw = textWidth(val);
  textStyle(NORMAL); textSize(Math.max(8, size * 0.45));
  const uw = textWidth('AQI');
  const dot = Math.max(5, size * 0.28), gap1 = dot * 0.9, gap2 = 3;
  const total = dot + gap1 + vw + gap2 + uw;
  let gx = x - total / 2;
  noStroke(); fill(r,g,b,1);
  ellipse(gx + dot/2, y - size * 0.34, dot, dot);
  gx += dot + gap1;
  textAlign(LEFT, BASELINE); textStyle(BOLD); textSize(size); fill(241,240,225,1);
  text(val, gx, y);
  textStyle(NORMAL); textSize(Math.max(8, size * 0.45)); fill(241,240,225,0.6);
  text('AQI', gx + vw + gap2, y);
}

// "361 days" (+ Frozen pill) centred on x
function _daysLine(x, y, yr, info) {
  const dayStr = `${info.days || '—'}`;
  textFont('Manrope'); textStyle(BOLD); textSize(12);
  const dw = textWidth(dayStr);
  textStyle(NORMAL); textSize(11);
  const lw = textWidth(' days');
  const pillW = frozen[yr] ? 52 : 0, pillGap = frozen[yr] ? 8 : 0;
  let gx = x - (dw + lw + pillGap + pillW) / 2;
  noStroke(); textAlign(LEFT, BASELINE);
  textStyle(BOLD); textSize(12); fill(241,240,225,0.9); text(dayStr, gx, y);
  textStyle(NORMAL); textSize(11); fill(241,240,225,0.58); text(' days', gx + dw, y);
  if (frozen[yr]) {
    const px = gx + dw + lw + pillGap;
    fill(167,199,231,1); rect(px, y - 12, pillW, 16, 8);
    fill(16,16,21,1); textStyle(BOLD); textSize(9.5); textAlign(CENTER, BASELINE);
    text('Frozen', px + pillW/2, y - 0.5);
  }
}

// "2023  ● 95.2" row for the compare centre, centred on x
function _compareRow(x, y, yr, info, size) {
  textFont('Manrope'); textStyle(BOLD); textSize(size);
  const yrStr = String(yr), yw = textWidth(yrStr);
  const val = info.hasAvg ? info.avg.toFixed(1) : '—';
  const vw = textWidth(val);
  const dot = Math.max(5, size * 0.42), g1 = 10, g2 = 5;
  const fz = frozen[yr], fzW = fz ? 6 + 6 : 0;
  let gx = x - (yw + g1 + dot + g2 + vw + fzW) / 2;
  noStroke(); textAlign(LEFT, BASELINE);
  fill(241,240,225,0.62); text(yrStr, gx, y);
  gx += yw + g1;
  if (info.hasAvg) { const [r,g,b] = _catRGB(info.avg); fill(r,g,b,1); }
  else fill(241,240,225,0.3);
  ellipse(gx + dot/2, y - size * 0.34, dot, dot);
  gx += dot + g2;
  fill(241,240,225,1); text(val, gx, y);
  if (fz) { fill(167,199,231,1); ellipse(gx + vw + 9, y - size * 0.34, 6, 6); }   // frozen marker
}

function drawRingLabels() {
  const k = RING.progress;
  const la = k >= 1 ? 1 : Math.max(0, (k - 0.65) / 0.35);   // labels settle in at the end of a morph
  const ctx = drawingContext;
  ctx.save();
  ctx.globalAlpha = la;

  const shown = YEARS.filter(y => RING.cur[y].alpha > 0.5);
  const g0 = RING.cur[shown[0] || VIEW.year];
  const cr = g0.rIn - 6;
  _centreDisc(g0.cx, g0.cy, cr);

  if (!VIEW.compare || VIEW.years.length === 1) {
    // Single year — MALAD · AQI · days (+ Frozen)
    const yr = VIEW.compare ? VIEW.years[0] : VIEW.year;
    const info = _yearInfo(yr);
    textFont('Space Grotesk'); textStyle(BOLD); textSize(Math.max(10, Math.min(15, cr * 0.15))); _setSpacing(2);
    noStroke(); fill(167,199,231,0.95); textAlign(CENTER, BASELINE);
    text('MALAD', g0.cx, g0.cy - cr * 0.3);
    _setSpacing(0);
    _aqiLine(g0.cx, g0.cy + cr * 0.12, info, Math.max(14, Math.min(32, cr * 0.32)));
    _daysLine(g0.cx, g0.cy + cr * 0.46, yr, info);
  } else {
    // Comparison — MALAD, then one row per selected year
    const rows = VIEW.years.slice().sort();
    const size = Math.max(11, Math.min(15, cr * 0.15)), rowH = size * 1.55;
    const nameH = size + 8;
    const total = nameH + rows.length * rowH;
    let y = g0.cy - total / 2 + size;
    textFont('Space Grotesk'); textStyle(BOLD); textSize(size * 0.92); _setSpacing(2);
    noStroke(); fill(167,199,231,0.95); textAlign(CENTER, BASELINE);
    text('MALAD', g0.cx, y);
    _setSpacing(0);
    y += nameH;
    rows.forEach(yr => { _compareRow(g0.cx, y, yr, _yearInfo(yr), size); y += rowH; });

    // Year tag outside each arc
    shown.forEach(yr => {
      const g = RING.cur[yr];
      const mid = (g.a0 + g.a1) / 2, R = g.rOut + 16;
      textFont('Manrope'); textStyle(BOLD); textSize(13); noStroke();
      fill(frozen[yr] ? 167 : 241, frozen[yr] ? 199 : 240, frozen[yr] ? 231 : 225, 0.9);
      textAlign(CENTER, CENTER);
      text(String(yr), g.cx + Math.cos(mid) * R, g.cy + Math.sin(mid) * R);
    });
  }

  // hint (top-left)
  noStroke(); fill(167,199,231,0.9);
  ellipse(PAD + 6, 20, 5, 5);
  textFont('Manrope'); textStyle(NORMAL); textSize(10.5); fill(241,240,225,0.58);
  textAlign(LEFT, CENTER);
  text('Click the circle to freeze  ·  Hover to inspect', PAD + 16, 20);
  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════
//  SEASONAL AMBIENCE — decorative background weather (presentation only)
//  Drawn behind the particles, clipped to each visible ring / arc. Reads
//  activeSeason and the ring geometry; never changes data, particles or
//  p5's random/noise state (uses Math.random and the raw 2D context).
// ══════════════════════════════════════════════════════════════════
const AMBIENCE = { key:null, zones:[], last:0, t:0, S:1 };
const _ambReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const _rand = (a, b) => a + Math.random() * (b - a);

function _buildAmbience(w, h) {
  const area = w * h;
  const make = () => {
    const items = [];
    if (activeSeason === 'winter') {
      // Outlined six-armed crystals — deliberately unlike the filled,
      // glowing AQI particles so the two can't be confused.
      const n = Math.round(area / 5200);
      for (let i = 0; i < n; i++) items.push({
        x:_rand(0,w), y:_rand(0,h), r:_rand(3.5,7), vy:_rand(10,28),
        sway:_rand(6,18), ph:_rand(0,6.28), f:_rand(0.6,1.4), a:_rand(0.22,0.5),
        rot:_rand(0,1.05), spin:_rand(-0.6,0.6)
      });
    } else if (activeSeason === 'monsoon') {
      const n = Math.round(area / 2400);
      for (let i = 0; i < n; i++) items.push({
        x:_rand(-40,w), y:_rand(0,h), len:_rand(10,22), vy:_rand(420,640), a:_rand(0.18,0.42)
      });
    } else if (activeSeason === 'preSummer') {
      const n = Math.round(area / 4200);
      for (let i = 0; i < n; i++) items.push({
        x:_rand(0,w), y:_rand(0,h), r:_rand(0.7,2.0), vx:_rand(8,22),
        ph:_rand(0,6.28), a:_rand(0.20,0.45)
      });
    } else if (activeSeason === 'summer') {
      const n = Math.round(area / 9000);
      for (let i = 0; i < n; i++) items.push({
        x:_rand(0,w), y:_rand(0,h), r:_rand(0.6,1.6), vy:_rand(4,12),
        ph:_rand(0,6.28), a:_rand(0.08,0.22)
      });
    } else if (activeSeason === 'postMonsoon') {
      const n = Math.max(6, Math.round(area / 30000));
      for (let i = 0; i < n; i++) items.push({
        x:_rand(0,w), y:_rand(0,h*1.2), r:_rand(40,110), vy:_rand(5,12),
        vx:_rand(-4,4), a:_rand(0.06,0.12)
      });
    }
    return items;
  };
  return [2025, 2024, 2023].map(yr => ({ yr, items: make() }));
}

function drawSeasonAmbience() {
  // Weather is simulated in a square box the size of a default ring and
  // scaled onto whatever ring / arc each year currently occupies.
  const S = Math.max(80, Math.round(_ringFrame().dSingle));
  const w = S, h = S;
  const key = `${activeSeason}|${S}`;
  if (AMBIENCE.key !== key) {
    AMBIENCE.key = key;
    AMBIENCE.zones = _buildAmbience(w, h);
    AMBIENCE.last = performance.now();
  }
  if (activeSeason === 'all') return;

  const now = performance.now();
  const dt  = _ambReduce.matches ? 0 : Math.min((now - AMBIENCE.last) / 1000, 0.05);
  AMBIENCE.last = now;
  AMBIENCE.t += dt;
  const t = AMBIENCE.t;
  const ctx = drawingContext;

  AMBIENCE.zones.forEach(z => {
    const g = RING.cur[z.yr];
    const d = dt;                            // weather keeps moving even when a year is frozen
    if (!g || g.alpha < 0.01) return;
    const A = g.alpha;
    ctx.save();
    _ringPath(ctx, g);
    ctx.clip('evenodd');
    const sc = (g.rOut * 2) / S;
    ctx.translate(g.cx - g.rOut, g.cy - g.rOut);
    ctx.scale(sc, sc);

    if (activeSeason === 'winter') {
      ctx.strokeStyle = '#F1F0E1'; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
      z.items.forEach(s => {
        s.y += s.vy * d; s.ph += s.f * d; s.rot += s.spin * d;
        if (s.y > h + s.r) { s.y = -s.r; s.x = _rand(0, w); }
        const x = (s.x + Math.sin(s.ph) * s.sway + w) % w;
        ctx.globalAlpha = A * s.a;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {               // three crossing lines = six arms
          const ang = s.rot + k * 1.0472;
          const dx = Math.cos(ang) * s.r, dy = Math.sin(ang) * s.r;
          ctx.moveTo(x - dx, s.y - dy); ctx.lineTo(x + dx, s.y + dy);
          for (const sgn of [1, -1]) {              // small barbs near each tip
            const armDir = sgn === 1 ? ang : ang + Math.PI;
            const tx = x + sgn * dx * 0.55, ty = s.y + sgn * dy * 0.55;
            const b = s.r * 0.34;
            for (const off of [0.65, -0.65]) {
              ctx.moveTo(tx, ty);
              ctx.lineTo(tx + Math.cos(armDir + off) * b, ty + Math.sin(armDir + off) * b);
            }
          }
        }
        ctx.stroke();
      });
    }

    else if (activeSeason === 'monsoon') {
      ctx.strokeStyle = '#A7C7E7'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      z.items.forEach(r => {
        r.y += r.vy * d; r.x += r.vy * 0.12 * d;
        if (r.y > h + r.len) { r.y = -r.len; r.x = _rand(-40, w); }
        ctx.globalAlpha = A * r.a;
        ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + r.len * 0.12, r.y + r.len); ctx.stroke();
      });
    }

    else if (activeSeason === 'preSummer') {
      const haze = ctx.createLinearGradient(0, h, 0, h * 0.35);
      haze.addColorStop(0, 'rgba(214,200,172,0.11)');
      haze.addColorStop(1, 'rgba(214,200,172,0)');
      ctx.globalAlpha = A; ctx.fillStyle = haze; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#D6C8AC';
      z.items.forEach(p => {
        p.x += p.vx * d; p.ph += d * 0.8;
        if (p.x > w + 4) { p.x = -4; p.y = _rand(0, h); }
        ctx.globalAlpha = A * p.a;
        ctx.beginPath(); ctx.arc(p.x, p.y + Math.sin(p.ph) * 4, p.r, 0, 6.2832); ctx.fill();
      });
    }

    else if (activeSeason === 'summer') {
      const sx = w * 0.12, sy = -h * 0.18;
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.6);
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 1.1);
      glow.addColorStop(0, `rgba(255,240,214,${0.18 * pulse})`);
      glow.addColorStop(0.45, `rgba(255,240,214,${0.06 * pulse})`);
      glow.addColorStop(1, 'rgba(255,240,214,0)');
      ctx.globalAlpha = A; ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      ctx.save();                             // slow sun rays
      ctx.translate(sx, sy);
      ctx.rotate(Math.sin(t * 0.08) * 0.06);
      const L = Math.hypot(w, h) * 1.3;
      for (let i = 0; i < 7; i++) {
        const ang = 0.12 + i * 0.2;
        ctx.globalAlpha = A * (0.03 + 0.015 * Math.sin(t * 0.7 + i));
        ctx.fillStyle = '#FFF0D6';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang - 0.035) * L, Math.sin(ang - 0.035) * L);
        ctx.lineTo(Math.cos(ang + 0.035) * L, Math.sin(ang + 0.035) * L);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = '#FFF0D6';
      z.items.forEach(m => {
        m.y -= m.vy * d; m.ph += d;
        if (m.y < -4) { m.y = h + 4; m.x = _rand(0, w); }
        ctx.globalAlpha = A * m.a * (0.6 + 0.4 * Math.sin(m.ph * 1.5));
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.2832); ctx.fill();
      });
    }

    else if (activeSeason === 'postMonsoon') {
      z.items.forEach(s => {
        s.y -= s.vy * d; s.x += s.vx * d;
        if (s.y < -s.r) { s.y = h + s.r; s.x = _rand(0, w); }
        const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        gr.addColorStop(0, `rgba(196,192,184,${s.a})`);
        gr.addColorStop(1, 'rgba(196,192,184,0)');
        ctx.globalAlpha = A; ctx.fillStyle = gr;
        ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
      });
    }

    ctx.restore();
  });
}

function aqiCol(v) {
  if (v<=50)  return color(80,200,80);
  if (v<=100) return color(144,238,144);
  if (v<=200) return color(255,224,32);
  if (v<=300) return color(255,150,32);
  if (v<=400) return color(220,50,50);
  return            color(139,0,0);
}

function buildSystems() {
  // Particle area is narrower than the visual zone — the right column is
  // reserved for the year / AQI / days / Frozen badges so particles can't
  // overlap that text.
  const pW = canvasW - PAD*2 - BADGE_RESERVE;
  const iH = zoneH - 2;
  const make = (yr) => {
    const avg    = YEAR_SEASON_AVG[yr][activeSeason] ?? 80;
    const noData = NO_DATA_ZONES.has(`${yr}-${activeSeason}`);
    const entries= noData ? [] : getDailyEntries(yr, activeSeason);
    const zY     = yr===2025 ? zones.top : yr===2024 ? zones.mid : zones.bot;
    return new ParticleSystem({ x:PAD, y:zY, w:pW, h:iH, entries, seasonAvg:avg, empty:noData, year:yr });
  };
  sys2025 = make(2025);
  sys2024 = make(2024);
  sys2023 = make(2023);
  updateDashboard();
}

// ══════════════════════════════════════════════════════════════════
//  PARTICLE SYSTEM
// ══════════════════════════════════════════════════════════════════
class ParticleSystem {
  constructor({ x, y, w, h, entries, seasonAvg, empty, year }) {
    this.x=x; this.y=y; this.w=w; this.h=h;
    this.seasonAvg=seasonAvg; this.year=year;
    this.empty=empty || !entries || entries.length===0;
    this.entries=this.empty?[]:entries;
    this.particles=[];
    if (!this.empty) this._build();
  }
  _build() {
    this.particles=[];
    this.entries.forEach((e) => {
      const ws = getWindSpeed(e.label, this.year);
      this.particles.push(new Particle({
        x: random(this.x+12, this.x+this.w-12),
        y: random(this.y+12, this.y+this.h-12),
        aqi: e.aqi, label: e.label, size: 4.5,
        alpha: random(0.5,0.9),
        zoneX:this.x, zoneY:this.y, zoneW:this.w, zoneH:this.h,
        year:this.year,
        windSpeed: ws
      }));
    });
  }
  isFrozen() { return frozen[this.year]; }
  getHovered(mx,my) {
    // Hover always works (no freeze required)
    for (let i=this.particles.length-1;i>=0;i--) {
      const p=this.particles[i];
      if (dist(mx,my,p.x,p.y) <= p.size*4) return p;
    }
    return null;
  }
  run() {
    const frz = this.isFrozen();
    for (const p of this.particles) {
      if (!frz) p.update();
      p.draw(frz);
    }
  }
}

// ══════════════════════════════════════════════════════════════════
//  PARTICLE — AQI-tiered atmospheric glow
// ══════════════════════════════════════════════════════════════════
class Particle {
  constructor({ x, y, aqi, label, size, alpha, zoneX, zoneY, zoneW, zoneH, year, windSpeed }) {
    this.x=x; this.y=y; this.aqi=aqi; this.label=label;
    this.size=size; this.alpha=alpha;
    this.zoneX=zoneX; this.zoneY=zoneY; this.zoneW=zoneW; this.zoneH=zoneH;
    this.year=year;
    this.nx=random(0,1000); this.ny=random(1000,2000);

    // Wind-based speed: map wind speed ranges to dot movement speeds
    // speed 1-5→1, 6-10→2, 11-15→3, 16-20→4, 21-25→5
    const ws = (windSpeed !== null && windSpeed !== undefined) ? windSpeed : 8;
    let windTier;
    if      (ws <= 5)  windTier = 1;
    else if (ws <= 10) windTier = 2;
    else if (ws <= 15) windTier = 3;
    else if (ws <= 20) windTier = 4;
    else               windTier = 5;

    // Map tier (1-5) to nspd (noise increment) and drift (displacement)
    // tier 1 = very slow, tier 5 = fast
    const NSPD_MAP  = [0, 0.0008, 0.0016, 0.0028, 0.0042, 0.006];
    const DRIFT_MAP = [0, 0.08,   0.18,   0.30,   0.44,   0.60];
    this.nspd  = NSPD_MAP[windTier];
    this.drift = DRIFT_MAP[windTier];

    this.c=aqiCol(aqi);
    this.searchMatch=false;
  }
  update() {
    const dx=(noise(this.nx)-0.5)*2*this.drift;
    const dy=(noise(this.ny)-0.5)*2*this.drift;
    this.x+=dx; this.y+=dy;
    this.nx+=this.nspd; this.ny+=this.nspd;
    const m=this.size+2;
    this.x=constrain(this.x,this.zoneX+m,this.zoneX+this.zoneW-m);
    this.y=constrain(this.y,this.zoneY+m,this.zoneY+this.zoneH-m);
  }
  draw(frz) {
    const r=red(this.c),g=green(this.c),b=blue(this.c);
    const v=this.aqi;

    let dim=1, scale=1, pulse=1;
    if (searchActive) {
      if (this.searchMatch) {
        scale = 1.22;
        pulse = 1 + sin(frameCount*0.09) * 0.12;
        dim   = 1.35;
      } else {
        dim = 0.22;
      }
    }

    const boost = (frz ? 1.08 : 1) * dim;
    const sz    = this.size * scale * pulse;
    const ax    = (a) => Math.min(this.alpha * a * boost, 1);

    noStroke();

    if (v <= 50) {
      fill(r,g,b, ax(0.10)); ellipse(this.x,this.y, sz*2.6);
      fill(r,g,b, ax(1.0));  ellipse(this.x,this.y, sz);
    } else if (v <= 100) {
      fill(r,g,b, ax(0.06)); ellipse(this.x,this.y, sz*4.2);
      fill(r,g,b, ax(0.22)); ellipse(this.x,this.y, sz*2.0);
      fill(r,g,b, ax(1.0));  ellipse(this.x,this.y, sz);
    } else if (v <= 200) {
      fill(r,g,b, ax(0.05)); ellipse(this.x,this.y, sz*5.6);
      fill(r,g,b, ax(0.12)); ellipse(this.x,this.y, sz*3.5);
      fill(r,g,b, ax(0.34)); ellipse(this.x,this.y, sz*1.9);
      fill(r,g,b, ax(1.0));  ellipse(this.x,this.y, sz);
    } else if (v <= 300) {
      fill(r,g,b, ax(0.04)); ellipse(this.x,this.y, sz*7.6);
      fill(r,g,b, ax(0.07)); ellipse(this.x,this.y, sz*5.6);
      fill(r,g,b, ax(0.13)); ellipse(this.x,this.y, sz*3.8);
      fill(r,g,b, ax(0.30)); ellipse(this.x,this.y, sz*2.2);
      fill(r,g,b, ax(0.58)); ellipse(this.x,this.y, sz*1.35);
      fill(r,g,b, ax(1.0));  ellipse(this.x,this.y, sz);
    } else if (v <= 400) {
      fill(r,g,b, ax(0.03)); ellipse(this.x,this.y, sz*9.5);
      fill(r,g,b, ax(0.06)); ellipse(this.x,this.y, sz*7.2);
      fill(r,g,b, ax(0.09)); ellipse(this.x,this.y, sz*5.2);
      fill(r,g,b, ax(0.14)); ellipse(this.x,this.y, sz*3.6);
      fill(r,g,b, ax(0.28)); ellipse(this.x,this.y, sz*2.3);
      fill(r,g,b, ax(0.55)); ellipse(this.x,this.y, sz*1.4);
      fill(r,g,b, ax(1.0));  ellipse(this.x,this.y, sz);
    } else {
      fill(r,g,b, ax(0.022)); ellipse(this.x,this.y, sz*12.0);
      fill(r,g,b, ax(0.04));  ellipse(this.x,this.y, sz*9.2);
      fill(r,g,b, ax(0.07));  ellipse(this.x,this.y, sz*7.0);
      fill(r,g,b, ax(0.10));  ellipse(this.x,this.y, sz*5.2);
      fill(r,g,b, ax(0.16));  ellipse(this.x,this.y, sz*3.6);
      fill(r,g,b, ax(0.30));  ellipse(this.x,this.y, sz*2.3);
      fill(r,g,b, ax(0.60));  ellipse(this.x,this.y, sz*1.4);
      fill(r,g,b, ax(1.0));   ellipse(this.x,this.y, sz);
    }

    if (searchActive && this.searchMatch) {
      const ph = 0.45 + 0.35 * Math.sin(frameCount * 0.1);
      noFill();
      stroke(255,255,255, ph * 0.55);
      strokeWeight(1.1);
      ellipse(this.x, this.y, sz * 4.2 + 3 * Math.sin(frameCount * 0.1));
      noStroke();
    }
  }
}

// ══════════════════════════════════════════════════════════════════
//  MOUSE — click-to-freeze + hover on frozen sections
// ══════════════════════════════════════════════════════════════════
function getSystemForY(my) {
  // Each zone occupies [zones.<x>, zones.<x>+zoneH]. The space between zones
  // (ZONE_GAP) is dead area — clicks there don't toggle anything.
  if (my >= zones.top && my < zones.top + zoneH) return sys2025;
  if (my >= zones.mid && my < zones.mid + zoneH) return sys2024;
  if (my >= zones.bot && my < zones.bot + zoneH) return sys2023;
  return null;
}

function mouseClicked() {
  // Don't process canvas clicks unless the dashboard is actually visible
  // (prevents the locality-card click that enters the dashboard from also
  //  toggling a zone's frozen state on entry).
  const dash = document.getElementById('dashboard');
  if (!dash || !dash.classList.contains('visible')) return;

  // Only act inside the viz canvas bounds
  if (mouseX < PAD || mouseX > canvasW - PAD) return;
  if (mouseY < PAD || mouseY > canvasH - PAD) return;

  const sys = getSystemForY(mouseY);
  if (!sys || sys.empty) return;

  const yr = sys.year;
  const wasFrozen = frozen[yr];
  frozen[yr] = !wasFrozen;

  if (wasFrozen) {
    // Unfreeze: hide tooltip, reset cursor
    hideTooltip();
    const cnv = document.querySelector('#viz-wrap canvas');
    if (cnv) cnv.style.cursor = 'default';
  }
  updateFrozenTags();
}

function updateFrozenTags() {
  // Update canvas badges to show/hide Frozen tag — handled in drawZoneBadges
  // (tag rendered inside p5 draw loop)
}

function mouseMoved() {
  hoveredParticle = null;
  const systems = [sys2025, sys2024, sys2023];
  for (const s of systems) {
    if (!s || s.empty) continue;
    // Only show hover tooltip when section is frozen
    if (!frozen[s.year]) continue;
    const hit = s.getHovered(mouseX, mouseY);
    if (hit) { hoveredParticle = hit; showTooltip(hit, mouseX, mouseY); return; }
  }
  hideTooltip();
  const cnv = document.querySelector('#viz-wrap canvas');
  if (cnv) cnv.style.cursor = 'default';
}

function showTooltip(p, mx, my) {
  const tt=document.getElementById('tooltip');
  const wrap=document.getElementById('viz-wrap');
  const wR=wrap.getBoundingClientRect();
  const c=aqiCategory(p.aqi);
  document.getElementById('tt-aqi-val').textContent=`${p.aqi.toFixed(1)} AQI`;
  document.getElementById('tt-aqi-val').style.color=c.color;
  document.getElementById('tt-date-val').textContent=`${p.label.replace('_',' ')} · ${p.year}`;

  // Wind data — only show if available for this exact date
  const windEl = document.getElementById('tt-wind-val');
  const windSpeedEl = document.getElementById('tt-wind-speed');
  const windVal = getWindSpeed(p.label, p.year);
  if (windVal !== null) {
    windSpeedEl.textContent = `${windVal.toFixed(1)} km/h · 10 m`;
    windEl.style.display = 'flex';
  } else {
    windEl.style.display = 'none';
  }

  tt.style.borderColor=`rgba(${c.cat_rgb},0.4)`;
  let tx=mx+16, ty=my-52;
  if(tx+120>wR.width) tx=mx-126;
  if(ty<5) ty=my+12;
  tt.style.left=tx+'px'; tt.style.top=ty+'px'; tt.style.display='block';
  const cnv=document.querySelector('#viz-wrap canvas');
  if(cnv) cnv.style.cursor='pointer';
}

function hideTooltip() {
  document.getElementById('tooltip').style.display='none';
}

// ══════════════════════════════════════════════════════════════════
//  DASHBOARD + FLOATING AQI UPDATE
// ══════════════════════════════════════════════════════════════════
function updateDashboard() {
  const stats = getSeasonStats(activeSeason);

  if (stats.max) {
    const mc=aqiCategory(stats.max.aqi);
    document.getElementById('ins-high').textContent=stats.max.aqi.toFixed(1);
    document.getElementById('ins-high').style.color=mc.color;
    document.getElementById('ins-high-date').textContent=`${stats.max.label.replace('_',' ')} · ${stats.max.year}`;
  }
  if (stats.min) {
    const mc=aqiCategory(stats.min.aqi);
    document.getElementById('ins-low').textContent=stats.min.aqi.toFixed(1);
    document.getElementById('ins-low').style.color=mc.color;
    document.getElementById('ins-low-date').textContent=`${stats.min.label.replace('_',' ')} · ${stats.min.year}`;
  }
  document.getElementById('ins-avg').textContent=stats.avg||'—';
  document.getElementById('ins-avg-lbl').textContent=SEASON_LABEL[activeSeason];
  document.getElementById('ins-caption').textContent=SEASON_CAPTIONS[activeSeason];

  const newsArr=NEWS_DATA[activeSeason]||NEWS_DATA.all;
  const n=newsArr[0];
  document.getElementById('news-headline').textContent=n.headline;
  document.getElementById('news-source').textContent=n.source;
  document.getElementById('news-link').href=n.url;
}

function windowResized() {
  const wrap=document.getElementById('viz-wrap');
  canvasW=wrap.offsetWidth; canvasH=wrap.offsetHeight;
  resizeCanvas(canvasW,canvasH);
  computeLayout(); buildSystems();
}

// ══════════════════════════════════════════════════════════════════
//  RING VIEW — pointer adapter (presentation only)
//  The existing freeze / hover handlers work in each year's logical
//  zone. Map the pointer from the ring back into that zone, run the
//  unchanged handlers, then restore the real pointer position.
// ══════════════════════════════════════════════════════════════════
function _ringToLogical(mx, my) {
  if (!RING.cur) return null;
  const systems = { 2025:sys2025, 2024:sys2024, 2023:sys2023 };
  for (const yr of YEARS) {
    const s = systems[yr];
    if (!s) continue;
    const uv = _ringUnproject(RING.cur[yr], mx, my);
    if (uv) return { x: s.x + uv.u * s.w, y: s.y + uv.v * s.h };
  }
  return null;
}
const _logicalMouseClicked = mouseClicked;
const _logicalMouseMoved   = mouseMoved;
window.mouseClicked = function (e) {
  if (e && e.target && e.target.closest && e.target.closest('.viz-controls')) return;
  const rx = mouseX, ry = mouseY;
  const L = _ringToLogical(rx, ry) || { x:-1e5, y:-1e5 };
  window.mouseX = L.x; window.mouseY = L.y;
  try { return _logicalMouseClicked(e); }
  finally { window.mouseX = rx; window.mouseY = ry; }
};
window.mouseMoved = function (e) {
  const rx = mouseX, ry = mouseY;
  // Find the particle under the cursor in screen space (same radius rule as
  // getHovered: size × 4, topmost first), then hand its logical position to
  // the unchanged hover handler.
  let L = null, picked = null;
  const hits = RING.hits || [];
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (Math.hypot(rx - h.x, ry - h.y) <= h.p.size * 4) { picked = h.p; L = { x: h.p.x, y: h.p.y }; break; }
  }
  if (!L) L = { x:-1e5, y:-1e5 };
  window.mouseX = L.x; window.mouseY = L.y;
  try { _logicalMouseMoved(e); }
  finally { window.mouseX = rx; window.mouseY = ry; }
  // The tooltip must describe the exact particle under the cursor. Same rule
  // as before: only particles of a frozen year can be inspected.
  if (picked && frozen[picked.year]) {
    hoveredParticle = picked;
    showTooltip(picked, rx, ry);
  } else if (hoveredParticle) {
    showTooltip(hoveredParticle, rx, ry);                    // keep tooltip at the real cursor
  }
};

/* ═════════ 2. LOCALITY, MAP, SEARCH ═════════ */
// ══════════════════════════════════════════════════════════════════
//  LOCALITY SELECT SCREEN — Cards, Map, Confirm Button
// ══════════════════════════════════════════════════════════════════
const grid = document.getElementById('loc-grid');

LOCALITIES.forEach(loc => {
  const card = document.createElement('div');
  card.className = 'loc-card' + (loc.id==='malad'?' active-card':'');
  card.dataset.id = loc.id;
  card.innerHTML = `
    <div class="loc-card-name">${loc.name}</div>
    <div class="loc-card-sub">MUMBAI · AQI 2023–25</div>`;
  card.addEventListener('click', () => {
    document.querySelectorAll('.loc-card').forEach(c=>c.classList.remove('active-card'));
    card.classList.add('active-card');
    selectedLocality = loc;
    setMapMarker(loc);
    document.getElementById('loc-map-label').textContent = loc.name.toUpperCase();
    if (typeof updateDashboard === 'function') updateDashboard();
    // Immediately enter dashboard on click — no confirm step needed
    enterDashboard();
  });
  grid.appendChild(card);
});

function enterDashboard() {
  document.getElementById('tb-loc-name').textContent = selectedLocality.name.toUpperCase();
  // Ensure no section is frozen on enter
  frozen[2025]=false; frozen[2024]=false; frozen[2023]=false;
  document.getElementById('loc-screen').classList.add('hidden');
  setTimeout(() => {
    document.getElementById('dashboard').classList.add('visible');
    setTimeout(() => {
      if (typeof windowResized === 'function') windowResized();
    }, 50);
  }, 300);
}

// ── LEAFLET MAP ───────────────────────────────────────────────
let _map = null;

// Localities with AQI data verified in this file. The historical dataset
// (RAW / WIND_DATA) is a single series from the Mindspace, Malad West
// station; no other locality has its own data, so only Malad is mapped.
const DATA_LOCALITY_IDS = ['malad'];
const _dataMarkers = {};

function _pinIcon(selected) {
  return L.divIcon({
    className:'',
    html:`<div class="aqi-pin${selected ? ' is-selected' : ''}"><div class="aqi-pin-pulse"></div></div>`,
    iconSize:[24,34],
    iconAnchor:[12,34]
  });
}

function initMap() {
  if (_map) return;
  _map = L.map('loc-map', {
    zoomControl:false, attributionControl:false,
    dragging:true, scrollWheelZoom:false, doubleClickZoom:false, touchZoom:false, keyboard:false
  }).setView(LOCALITIES[0].coords, 13);

  // Esri dark grey basemap + labels (no API key required; credit shown on the map)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom:16
  }).addTo(_map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom:16, opacity:0.8
  }).addTo(_map);

  // One marker per data-backed locality; clicking a marker runs the same
  // handler as clicking its locality card, so both stay in sync.
  const eligible = LOCALITIES.filter(l => DATA_LOCALITY_IDS.includes(l.id));
  eligible.forEach(loc => {
    const m = L.marker(loc.coords, { icon:_pinIcon(false), title:`${loc.name} — select locality`, keyboard:true }).addTo(_map);
    m.on('click', () => {
      const card = document.querySelector(`.loc-card[data-id="${loc.id}"]`);
      if (card) card.click();
    });
    _dataMarkers[loc.id] = m;
  });

  // Frame every data-backed location
  if (eligible.length > 1) {
    _map.fitBounds(L.latLngBounds(eligible.map(l => l.coords)), { padding:[56,56], maxZoom:14 });
  } else if (eligible.length === 1) {
    _map.setView(eligible[0].coords, 14);
  }

  setMapMarker(selectedLocality);
}

function setMapMarker(loc) {
  if (!_map) return;
  // Highlight the selected locality's marker; others stay muted
  Object.keys(_dataMarkers).forEach(id => {
    _dataMarkers[id].setIcon(_pinIcon(id === loc.id));
  });
}

initMap();

// ── Back to localities
document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('dashboard').classList.remove('visible');
  setTimeout(() => {
    document.getElementById('loc-screen').classList.remove('hidden');
    if (_map) setTimeout(()=>_map.invalidateSize(), 50);
  }, 200);
  resetSearch();
});

// ══════════════════════════════════════════════════════════════════
//  SEASON BUTTONS
// ══════════════════════════════════════════════════════════════════
const MONTH_HINTS = {
  all:         'All Months: Jan · Feb · Mar · Apr · May · Jun · Jul · Aug · Sep · Oct · Nov · Dec',
  winter:      'Winter Months: Dec · Jan · Feb',
  preSummer:   'Pre-Summer Months: Mar · Apr',
  summer:      'Summer Months: May · Jun',
  monsoon:     'Monsoon Months: Jul · Aug · Sep',
  postMonsoon: 'Post-Monsoon Months: Oct · Nov'
};

let _programmaticSeasonChange = false;

document.querySelectorAll('.s-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.s-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    activeSeason = btn.dataset.season;
    frozen[2025]=false; frozen[2024]=false; frozen[2023]=false;
    hideTooltip();
    document.getElementById('hint-bar').textContent = MONTH_HINTS[activeSeason];
    if (!_programmaticSeasonChange) resetSearch(false);
    setTimeout(() => { if (typeof buildSystems === 'function') buildSystems(); }, 10);
  });
});

// ══════════════════════════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════════════════════════
const MONTH_NAME_TO_IDX = {
  jan:0,january:0, feb:1,february:1, mar:2,march:2, apr:3,april:3,
  may:4, jun:5,june:5, jul:6,july:6, aug:7,august:7,
  sep:8,september:8,sept:8, oct:9,october:9, nov:10,november:10, dec:11,december:11
};
const SEASON_KEYWORD_TO_KEY = [
  ['post-monsoon','postMonsoon'], ['post monsoon','postMonsoon'], ['postmonsoon','postMonsoon'],
  ['pre-summer','preSummer'], ['pre summer','preSummer'], ['presummer','preSummer'],
  ['winter','winter'], ['summer','summer'], ['monsoon','monsoon']
];
const FESTIVALS = {
  diwali:   { 2023:{m:10,d:12}, 2024:{m:10,d:1}, 2025:{m:9,d:20} },
  holi:     { 2023:{m:2, d:8},  2024:{m:2, d:25},2025:{m:2,d:14} },
  ganesh:   { 2023:{m:8, d:19}, 2024:{m:8, d:7}, 2025:{m:7,d:27} },
  navratri: { 2023:{m:9, d:15}, 2024:{m:9, d:3}, 2025:{m:8,d:22} },
  christmas:{ 2023:{m:11,d:25}, 2024:{m:11,d:25},2025:{m:11,d:25} },
  newyear:  { 2024:{m:0, d:1},  2025:{m:0, d:1} }
};
const FESTIVAL_ALIASES = {
  diwali:'diwali', deepavali:'diwali',
  holi:'holi',
  ganesh:'ganesh', ganpati:'ganesh', 'ganesh chaturthi':'ganesh',
  navratri:'navratri', dussehra:'navratri',
  christmas:'christmas', xmas:'christmas',
  newyear:'newyear', "new year":'newyear'
};
const FESTIVAL_SEASON_HINT = {
  diwali:'postMonsoon', holi:'preSummer',
  ganesh:'monsoon', navratri:'all',
  christmas:'winter', newyear:'winter'
};

function parseSearch(raw) {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const yearM = s.match(/\b(2023|2024|2025)\b/);
  const year = yearM ? parseInt(yearM[1]) : null;

  const aliases = Object.keys(FESTIVAL_ALIASES).sort((a,b)=>b.length-a.length);
  for (const a of aliases) {
    const re = new RegExp(`\\b${a.replace(/\s/g,'\\s')}\\b`, 'i');
    if (re.test(s)) return { type:'festival', festival:FESTIVAL_ALIASES[a], year };
  }

  for (const [kw, key] of SEASON_KEYWORD_TO_KEY) {
    const re = new RegExp(`\\b${kw.replace(/[-\s]/g,'[-\\s]?')}\\b`, 'i');
    if (re.test(s)) return { type:'season', season:key, year };
  }

  const numericDate = s.match(/\b(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?\b/);
  if (numericDate) {
    const a = parseInt(numericDate[1]), b = parseInt(numericDate[2]);
    let y = numericDate[3] ? parseInt(numericDate[3]) : year;
    if (y && y < 100) y += 2000;
    const day = a, monthIdx = b - 1;
    if (monthIdx >= 0 && monthIdx <= 11 && day >= 1 && day <= 31) {
      return { type:'date', monthIdx, day, year:y || year };
    }
  }

  const dayThenMonth = s.match(/\b(\d{1,2})\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b/i);
  if (dayThenMonth) {
    const day = parseInt(dayThenMonth[1]);
    const monthIdx = MONTH_NAME_TO_IDX[dayThenMonth[2].toLowerCase()];
    return { type:'date', monthIdx, day, year };
  }
  const monthThenDay = s.match(/\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\b/i);
  if (monthThenDay) {
    const monthIdx = MONTH_NAME_TO_IDX[monthThenDay[1].toLowerCase()];
    const day = parseInt(monthThenDay[2]);
    return { type:'date', monthIdx, day, year };
  }

  const monthKeys = Object.keys(MONTH_NAME_TO_IDX).sort((a,b)=>b.length-a.length);
  for (const k of monthKeys) {
    if (k.length < 3) continue;
    const re = new RegExp(`\\b${k}\\b`, 'i');
    if (re.test(s)) return { type:'month', monthIdx:MONTH_NAME_TO_IDX[k], year };
  }

  if (year) return { type:'year', year };
  return null;
}

function resetSearch(keepInput = false) {
  searchActive = false;
  [sys2025, sys2024, sys2023].forEach(s => {
    if (!s || !s.particles) return;
    s.particles.forEach(p => p.searchMatch = false);
  });
  Object.keys(frozen).forEach(y => frozen[y] = false);
  hideSearchResult();
  if (!keepInput) {
    const inp = document.getElementById('tb-search-input');
    if (inp) inp.value = '';
    document.getElementById('tb-search').classList.remove('has-text');
  }
}

function applySearch(target) {
  searchActive = false;
  [sys2025, sys2024, sys2023].forEach(s => {
    if (!s || !s.particles) return;
    s.particles.forEach(p => p.searchMatch = false);
  });

  if (!target) {
    hideSearchResult();
    Object.keys(frozen).forEach(y => frozen[y] = false);
    return;
  }

  let targetSeason = 'all';
  if (target.type === 'season') targetSeason = target.season;
  else if (target.type === 'festival') targetSeason = FESTIVAL_SEASON_HINT[target.festival] || 'all';
  else targetSeason = 'all';

  if (targetSeason !== activeSeason) {
    _programmaticSeasonChange = true;
    const btn = document.querySelector(`.s-btn[data-season="${targetSeason}"]`);
    if (btn) btn.click();
    _programmaticSeasonChange = false;
  }

  setTimeout(() => {
    const matched = matchParticles(target);
    if (matched.length) {
      searchActive = true;
      Object.keys(frozen).forEach(y => frozen[y] = false);
      if (target.year && frozen.hasOwnProperty(target.year)) {
        frozen[target.year] = true;
      } else {
        const counts = {};
        matched.forEach(p => { counts[p.year] = (counts[p.year]||0) + 1; });
        let topYr = null, topCnt = -1;
        Object.keys(counts).forEach(y => { if(counts[y]>topCnt){ topCnt=counts[y]; topYr=parseInt(y); } });
        if (topYr) frozen[topYr] = true;
      }
    } else {
      searchActive = false;
    }
    showSearchResult(target, matched);
  }, 40);
}

function matchParticles(target) {
  const matches = [];
  const systems = [{s:sys2025,yr:2025},{s:sys2024,yr:2024},{s:sys2023,yr:2023}];
  systems.forEach(({s,yr}) => {
    if (!s || s.empty) return;
    if (target.year && yr !== target.year) return;
    s.particles.forEach(p => {
      const [monStr, dayStr] = p.label.split('_');
      const pMonth = MONTH_NAMES.indexOf(monStr);
      const pDay = parseInt(dayStr);
      let match = false;
      if (target.type === 'date') {
        if (pMonth === target.monthIdx && pDay === target.day) match = true;
      } else if (target.type === 'month') {
        if (pMonth === target.monthIdx) match = true;
      } else if (target.type === 'year') {
        match = true;
      } else if (target.type === 'season') {
        match = true;
      } else if (target.type === 'festival') {
        const fd = FESTIVALS[target.festival] && FESTIVALS[target.festival][yr];
        if (fd && pMonth === fd.m && Math.abs(pDay - fd.d) <= 3) match = true;
      }
      if (match) { p.searchMatch = true; matches.push(p); }
    });
  });
  return matches;
}

function showSearchResult(target, matches) {
  // Renders inside the right-side dashboard panel (no longer overlaps the canvas).
  const el = document.getElementById('panel-search-result');
  const header = `
    <div class="psr-header">
      <div class="psr-tag">Search · ${selectedLocality.short}</div>
      <button class="psr-close" id="psr-close" aria-label="Close search result">×</button>
    </div>`;

  if (!matches.length) {
    el.innerHTML = `
      ${header}
      <div class="psr-headline">${describeTarget(target)}</div>
      <div class="psr-empty">No AQI records for this period at <b>${selectedLocality.short}</b>.</div>`;
    el.classList.add('visible');
    wirePsrClose();
    scrollPanelToSearchResult();
    return;
  }
  const avg = matches.reduce((a,p)=>a+p.aqi,0)/matches.length;
  let hi = matches[0], lo = matches[0];
  matches.forEach(p => { if(p.aqi>hi.aqi) hi=p; if(p.aqi<lo.aqi) lo=p; });
  const cat = aqiCategory(avg);
  let newsSeasonKey = 'all';
  if (target.type === 'season') newsSeasonKey = target.season;
  else if (target.type === 'festival') newsSeasonKey = FESTIVAL_SEASON_HINT[target.festival] || activeSeason;
  else newsSeasonKey = activeSeason;
  const news = (NEWS_DATA[newsSeasonKey] || NEWS_DATA.all)[0];

  let primaryRow = '';
  if (target.type === 'date' && matches.length === 1) {
    const only = matches[0];
    const onlyCat = aqiCategory(only.aqi);
    primaryRow = `<div class="psr-row"><span>AQI · ${only.label.replace('_',' ')} ${only.year}</span><b style="color:${onlyCat.color}">${only.aqi.toFixed(1)}</b></div>`;
  } else {
    primaryRow = `<div class="psr-row"><span>Average AQI</span><b style="color:${cat.color}">${avg.toFixed(1)}</b></div>
                  <div class="psr-row"><span>Range</span><b>${lo.aqi.toFixed(1)} – ${hi.aqi.toFixed(1)}</b></div>
                  <div class="psr-row"><span>Days matched</span><b>${matches.length}</b></div>`;
  }
  el.innerHTML = `
    ${header}
    <div class="psr-headline">${describeTarget(target)}</div>
    ${primaryRow}
    <div class="psr-cat" style="background:rgba(${cat.cat_rgb},0.15);color:${cat.color};border:1px solid rgba(${cat.cat_rgb},0.32)">${cat.cat}</div>
    <div class="psr-note">${news.headline}</div>`;
  el.classList.add('visible');
  wirePsrClose();
  scrollPanelToSearchResult();
}

function scrollPanelToSearchResult() {
  // Smoothly scroll the right info panel to the top so the highlighted
  // search-result card is always in view, even if the user had scrolled down.
  const panel = document.getElementById('dash-panel');
  if (!panel) return;
  // Give the slide-down transition a tick to start, then scroll.
  requestAnimationFrame(() => {
    panel.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function wirePsrClose() {
  const btn = document.getElementById('psr-close');
  if (btn) btn.addEventListener('click', () => {
    resetSearch();
  });
}

function describeTarget(t) {
  if (!t) return '';
  if (t.type === 'date') return `${String(t.day).padStart(2,'0')} ${MONTH_NAMES[t.monthIdx]}${t.year?' '+t.year:''}`;
  if (t.type === 'month') return `${MONTH_NAMES[t.monthIdx]}${t.year?' '+t.year:''}`;
  if (t.type === 'year') return `${t.year}`;
  if (t.type === 'season') return `${SEASON_LABEL[t.season]}${t.year?' · '+t.year:''}`;
  if (t.type === 'festival') {
    const pretty = t.festival.charAt(0).toUpperCase() + t.festival.slice(1);
    return `${pretty}${t.year?' '+t.year:''}`;
  }
  return '';
}

function hideSearchResult() {
  // Hide both the legacy topbar popup (used for invalid-query hints) and the in-panel card
  const tb = document.getElementById('tb-search-result');
  if (tb) tb.classList.remove('visible');
  const panel = document.getElementById('panel-search-result');
  if (panel) panel.classList.remove('visible');
}

// Search UI wiring — bar is always shown wide; no expand/collapse toggle.
const _searchEl    = document.getElementById('tb-search');
const _searchInput = document.getElementById('tb-search-input');
const _searchClear = document.getElementById('tb-search-clear');

let _searchDebounce;
_searchInput.addEventListener('input', () => {
  const v = _searchInput.value;
  _searchEl.classList.toggle('has-text', !!v.trim());
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => {
    if (!v.trim()) { applySearch(null); return; }
    const target = parseSearch(v);
    if (!target) { showInvalidQueryHint(); return; }
    applySearch(target);
  }, 260);
});

_searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    clearTimeout(_searchDebounce);
    const v = _searchInput.value;
    if (!v.trim()) { applySearch(null); return; }
    const target = parseSearch(v);
    if (target) applySearch(target); else showInvalidQueryHint();
  } else if (e.key === 'Escape') {
    _searchInput.value = '';
    _searchEl.classList.remove('has-text');
    applySearch(null);
    _searchInput.blur();
  }
});

_searchClear.addEventListener('click', (e) => {
  e.stopPropagation();
  _searchInput.value = '';
  _searchEl.classList.remove('has-text');
  applySearch(null);
  _searchInput.focus();
});

function showInvalidQueryHint() {
  const el = document.getElementById('tb-search-result');
  el.innerHTML = `
    <div class="tsr-title">Try one of these</div>
    <div class="tsr-empty">
      "12 Dec 2024" · "November 2024"<br/>
      "Winter 2024" · "Diwali 2024"<br/>
      "Monsoon" · "2023"
    </div>`;
  el.classList.add('visible');
}

/* ═════════ 3. PRESENTATION LAYER ═════════ */
// ══════════════════════════════════════════════════════════════════
//  PRESENTATION LAYER — motion & keyboard access only.
//  Observes the DOM the application writes; never reads or changes
//  application state, data or calculations. Every animation ends on
//  the exact text the application produced.
// ══════════════════════════════════════════════════════════════════
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Restart a CSS animation class on an element
  function replay(el, cls) {
    if (!el || reduceMotion.matches) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // ── 1. Count-up for the bottom insight values ───────────────
  ['ins-high', 'ins-low', 'ins-avg'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    let displayed = el.textContent;
    let raf = 0;
    const obs = new MutationObserver(() => {
      const target = el.textContent;
      const from = parseFloat(displayed), to = parseFloat(target);
      cancelAnimationFrame(raf);
      if (reduceMotion.matches || isNaN(from) || isNaN(to) || from === to) {
        displayed = target;
        return;
      }
      const decimals = (target.split('.')[1] || '').length;
      const start = performance.now(), DUR = 420;
      const step = (now) => {
        const k = Math.min((now - start) / DUR, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        displayed = k < 1 ? (from + (to - from) * eased).toFixed(decimals) : target;
        el.textContent = displayed;
        obs.takeRecords();                 // ignore our own writes
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    obs.observe(el, { childList: true, characterData: true, subtree: true });
  });

  // ── 2. Gentle refresh on updated supporting text ────────────
  [['ins-high-date'], ['ins-low-date'], ['ins-avg-lbl'], ['ins-caption'], ['news-card'], ['hint-bar']]
    .forEach(([id]) => {
      const el = document.getElementById(id);
      if (!el) return;
      let last = el.textContent;
      new MutationObserver(() => {
        if (el.textContent === last) return;
        last = el.textContent;
        replay(el, 'ia-updated');
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });

  // ── 3. Canvas settle when the season changes ────────────────
  // Additional listener only; the existing season handler is untouched.
  const viz = document.getElementById('viz-wrap');
  document.querySelectorAll('.s-btn').forEach(btn => {
    btn.addEventListener('click', () => replay(viz, 'ia-refresh'));
  });

  // ── 4b. Year navigation + comparison (layout only) ──────────
  // Chooses which year(s) the circle shows; no data, calculation or
  // particle state is touched.
  const yrPrev = document.getElementById('yr-prev');
  const yrNext = document.getElementById('yr-next');
  const yrCur  = document.getElementById('yr-current');
  const yrNav  = yrCur && yrCur.parentElement;
  const vcToggle = document.getElementById('vc-toggle');
  const vcYears  = document.getElementById('vc-years');
  const YRS = [2023, 2024, 2025];

  function syncControls() {
    const i = YRS.indexOf(VIEW.year);
    if (yrCur && yrCur.textContent !== String(VIEW.year)) {
      yrCur.textContent = String(VIEW.year);
      replay(yrCur, 'ia-updated');
    }
    // Year navigation explores single years; it rests while comparing
    if (yrPrev) yrPrev.disabled = VIEW.compare || i <= 0;
    if (yrNext) yrNext.disabled = VIEW.compare || i >= YRS.length - 1;
    if (yrNav) yrNav.classList.toggle('is-muted', VIEW.compare);
    vcToggle.classList.toggle('is-on', VIEW.compare);
    vcToggle.setAttribute('aria-pressed', String(VIEW.compare));
    vcYears.hidden = !VIEW.compare;
    vcYears.querySelectorAll('.vc-chip').forEach(c => {
      const on = VIEW.years.includes(+c.dataset.year);
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', String(on));
    });
  }
  function setYear(yr) {
    if (!YRS.includes(yr) || yr === VIEW.year) return;
    VIEW.year = yr;
    if (typeof hideTooltip === 'function') hideTooltip();
    syncControls();
  }

  if (vcToggle && vcYears) {
    yrPrev && yrPrev.addEventListener('click', () => setYear(YRS[YRS.indexOf(VIEW.year) - 1]));
    yrNext && yrNext.addEventListener('click', () => setYear(YRS[YRS.indexOf(VIEW.year) + 1]));

    vcToggle.addEventListener('click', () => {
      VIEW.compare = !VIEW.compare;
      if (VIEW.compare) VIEW.years = [VIEW.year];        // start from the year being explored
      if (typeof hideTooltip === 'function') hideTooltip();
      syncControls();
    });
    vcYears.querySelectorAll('.vc-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const yr = +chip.dataset.year;
        if (VIEW.years.includes(yr)) {
          if (VIEW.years.length <= 1) { replay(chip, 'is-locked'); return; }   // keep at least one year
          VIEW.years = VIEW.years.filter(y => y !== yr);
        } else {
          VIEW.years = [...VIEW.years, yr].sort();
        }
        if (typeof hideTooltip === 'function') hideTooltip();
        syncControls();
      });
    });

    // When a search freezes a year that isn't on screen, bring that year into view
    const psr = document.getElementById('panel-search-result');
    if (psr) new MutationObserver(() => {
      if (!psr.classList.contains('visible')) return;
      const fy = YRS.find(y => frozen[y]);
      if (!fy) return;
      if (VIEW.compare) {
        if (!VIEW.years.includes(fy)) { VIEW.years = [...VIEW.years, fy].sort(); syncControls(); }
      } else setYear(fy);
    }).observe(psr, { childList: true, attributes: true, attributeFilter: ['class'] });

    syncControls();
  }

  // ── 4c. Data station mini-map (location context only) ───────
  // Shows where the historical dataset was recorded. Uses the existing
  // Malad coordinates from LOCALITIES; no data or app state is changed.
  (function () {
    const el = document.getElementById('mini-map');
    const dash = document.getElementById('dashboard');
    if (!el || !dash || typeof L === 'undefined' || typeof LOCALITIES === 'undefined') return;
    const station = LOCALITIES.find(l => l.id === 'malad');
    if (!station) return;
    const coords = document.getElementById('mini-map-coords');
    if (coords) coords.textContent =
      `${station.coords[0].toFixed(3)}° N · ${station.coords[1].toFixed(3)}° E`;

    let map = null;
    function init() {
      if (map) { map.invalidateSize(); return; }
      map = L.map(el, {
        zoomControl:false, attributionControl:false,
        dragging:true, scrollWheelZoom:false, doubleClickZoom:false,
        touchZoom:false, boxZoom:false, keyboard:false
      }).setView(station.coords, 14);
      const base = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom:16 }).addTo(map);
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom:16, opacity:0.75 }).addTo(map);
      L.marker(station.coords, {
        interactive:false, keyboard:false,
        icon: L.divIcon({ className:'', iconSize:[24,34], iconAnchor:[12,34],
          html:'<div class="aqi-pin is-selected"><div class="aqi-pin-pulse"></div></div>' })
      }).addTo(map);
      base.once('load', () => el.classList.add('is-ready'));
      setTimeout(() => el.classList.add('is-ready'), 1500);   // fallback if tiles are slow
    }
    // Leaflet needs a laid-out container: initialise when the dashboard is shown
    new MutationObserver(() => {
      if (dash.classList.contains('visible')) setTimeout(init, 60);
    }).observe(dash, { attributes:true, attributeFilter:['class'] });
    window.addEventListener('resize', () => { if (map) map.invalidateSize(); });
  })();

  // ── 4d. Localities without their own data yet ───────────────
  // Only Mindspace, Malad West has AQI data in this file. The other cards
  // still open the dashboard (unchanged behaviour); they get a "Coming soon"
  // badge, and the dashboard explains that Malad station data is shown.
  const DATA_IDS = ['malad'];
  document.querySelectorAll('.loc-card').forEach(card => {
    if (DATA_IDS.includes(card.dataset.id)) return;
    const name = card.querySelector('.loc-card-name');
    if (name && !name.querySelector('.loc-card-badge')) {
      const b = document.createElement('span');
      b.className = 'loc-card-badge';
      b.textContent = 'Coming soon';
      name.appendChild(document.createElement('br'));
      name.appendChild(b);
    }
  });
  const notice = document.getElementById('loc-notice');
  const noticeName = document.getElementById('loc-notice-name');
  const locName = document.getElementById('tb-loc-name');
  function syncNotice() {
    if (!notice || typeof selectedLocality === 'undefined') return;
    const pending = !DATA_IDS.includes(selectedLocality.id);
    if (pending && noticeName) noticeName.textContent = selectedLocality.name;
    notice.hidden = !pending;
  }
  if (locName) new MutationObserver(syncNotice).observe(locName, { childList:true, characterData:true, subtree:true });
  syncNotice();

  // ── 4g. Opening screen → locality selection ─────────────────
  // Decorative particle ring (interface colours only — not AQI data) and
  // the hand-off into the existing locality screen.
  (function () {
    const intro  = document.getElementById('intro-screen');
    const canvas = document.getElementById('intro-canvas');
    const loc    = document.getElementById('loc-screen');
    if (!intro || !canvas || !loc) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, raf = 0, running = true;
    const P = [];
    for (let i = 0; i < 220; i++) P.push({
      a: Math.random() * Math.PI * 2,
      t: Math.sqrt(Math.random()),                 // 0..1 across the ring band, even by area
      s: (Math.random() - 0.5) * 0.0018,           // slow drift around the ring
      ph: Math.random() * Math.PI * 2,
      z: 0.6 + Math.random() * 1.7,
      o: 0.12 + Math.random() * 0.5,
      blue: Math.random() < 0.28
    });
    function size() {
      const dpr = window.devicePixelRatio || 1;
      W = intro.clientWidth; H = intro.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      // Ring centred behind the wordmark
      const cx = W * 0.5, cy = H * 0.5;
      const R  = Math.min(W * 0.46, H * 0.44);
      const r0 = R * 0.32, fade = 0.85;
      ctx.strokeStyle = `rgba(241,240,225,${0.05 * fade})`; ctx.lineWidth = 1;
      [r0, (r0 + R) / 2, R].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); });
      for (const p of P) {
        if (!reduceMotion.matches) { p.a += p.s; p.ph += 0.01; }
        const r = r0 + p.t * (R - r0) + Math.sin(p.ph) * 3;
        ctx.fillStyle = p.blue ? `rgba(167,199,231,${p.o * fade})` : `rgba(241,240,225,${p.o * fade})`;
        ctx.beginPath(); ctx.arc(cx + Math.cos(p.a) * r, cy + Math.sin(p.a) * r, p.z, 0, Math.PI * 2); ctx.fill();
      }
      if (running && !reduceMotion.matches) raf = requestAnimationFrame(frame);
    }
    size(); frame();
    window.addEventListener('resize', () => { if (!running) return; size(); if (reduceMotion.matches) frame(); });

    // Click anywhere (or Enter / Space) continues to the locality screen
    let leaving = false;
    function explore(viaKeyboard) {
      if (leaving) return;
      leaving = true;
      intro.classList.add('is-leaving');
      setTimeout(() => {
        if (typeof window.iaShowLive === 'function') {        // next: the live "Right now" screen
          window.iaShowLive(viaKeyboard);
          return;
        }
        loc.classList.remove('hidden');                       // fallback: straight to locality selection
        if (typeof _map !== 'undefined' && _map) setTimeout(() => _map.invalidateSize(), 60);
        if (viaKeyboard) {
          const first = loc.querySelector('.loc-card');
          if (first) first.focus({ preventScroll: true });
        }
      }, reduceMotion.matches ? 0 : 520);                     // next screen appears in the opening gap
      setTimeout(() => {
        intro.classList.add('is-gone');
        running = false; cancelAnimationFrame(raf);
      }, reduceMotion.matches ? 60 : 1050);
    }
    intro.addEventListener('click', (e) => explore(e.detail === 0));
    intro.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); explore(true); }
    });
    intro.focus({ preventScroll: true });                     // so Enter works straight away

    // Return to the opening screen (from the dashboard logo). Plays the exit in
    // reverse: the ring zooms back out and "Invisible" / "AIR" come back together.
    function reopen() {
      if (!intro.classList.contains('is-gone')) return;
      leaving = false;
      intro.classList.add('is-returning');                    // no fade delay on the way back
      intro.classList.remove('is-gone');
      void intro.offsetWidth;                                 // start from the parted state
      intro.classList.remove('is-leaving');
      running = true; cancelAnimationFrame(raf); size(); frame();
      intro.focus({ preventScroll: true });
      setTimeout(() => intro.classList.remove('is-returning'), 1200);
    }

    // Dashboard logo → back to the opening screen
    const brand = document.getElementById('tb-brand');
    const dashEl = document.getElementById('dashboard');
    if (brand && dashEl) brand.addEventListener('click', () => {
      if (typeof resetSearch === 'function') resetSearch();
      if (typeof hideTooltip === 'function') hideTooltip();
      dashEl.classList.remove('visible');                     // dashboard fades out as before
      reopen();
    });
  })();

  // ── 4h. "Right now" — live AQI estimate ─────────────────────
  // Live PM2.5 / PM10 for the Malad station coordinates from Open-Meteo's
  // air-quality API (Copernicus CAMS model, no key). India AQI (NAQI) is
  // computed from the 24-hour average of each pollutant, as the official
  // index uses 24-hour averages. Shown only as a labelled model estimate;
  // if the service can't be reached, no number is shown.
  (function () {
    const screen = document.getElementById('lv-screen');
    const canvas = document.getElementById('lv-canvas');
    const cta    = document.getElementById('lv-cta');
    const loc    = document.getElementById('loc-screen');
    if (!screen || !canvas || !cta || !loc || typeof LOCALITIES === 'undefined') return;
    const station = LOCALITIES.find(l => l.id === 'malad');
    const $ = id => document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // CPCB National AQI breakpoints: [C_low, C_high, I_low, I_high] (µg/m³, 24-hour)
    const BP = {
      pm25: [[0,30,0,50],[31,60,51,100],[61,90,101,200],[91,120,201,300],[121,250,301,400],[251,380,401,500]],
      pm10: [[0,50,0,50],[51,100,51,100],[101,250,101,200],[251,350,201,300],[351,430,301,400],[431,510,401,500]]
    };
    function subIndex(c, table) {
      if (c == null || isNaN(c)) return null;
      c = Math.round(c);
      for (const [cl, ch, il, ih] of table) if (c <= ch) return il + (ih - il) * (c - cl) / (ch - cl);
      return 500;
    }

    let cache = null, fetchedAt = 0, pending = null;
    async function load() {
      if (cache && Date.now() - fetchedAt < 10 * 60 * 1000) return cache;   // reuse for 10 minutes
      if (pending) return pending;
      const [lat, lon] = station.coords;
      const url = 'https://air-quality-api.open-meteo.com/v1/air-quality'
        + `?latitude=${lat}&longitude=${lon}`
        + '&current=pm10,pm2_5&hourly=pm10,pm2_5&past_days=1&forecast_days=1&timezone=Asia%2FKolkata';
      pending = (async () => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        try {
          const res = await fetch(url, { signal: ctrl.signal });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const j = await res.json();
          const times = j.hourly.time, now = j.current.time;
          let idx = times.findIndex(t => t > now) - 1;               // last hour at or before now
          if (idx < 0) idx = times.length - 1;
          const avg24 = arr => {
            const v = arr.slice(Math.max(0, idx - 23), idx + 1).filter(x => x != null);
            return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
          };
          const pm25avg = avg24(j.hourly.pm2_5), pm10avg = avg24(j.hourly.pm10);
          const subs = [subIndex(pm25avg, BP.pm25), subIndex(pm10avg, BP.pm10)].filter(v => v != null);
          if (!subs.length) throw new Error('no pollutant values');
          cache = { aqi: Math.round(Math.max(...subs)), pm25: j.current.pm2_5, pm10: j.current.pm10, time: now };
          fetchedAt = Date.now();
          return cache;
        } finally { clearTimeout(timer); pending = null; }
      })();
      return pending;
    }

    // Particles: their number and colour follow the live reading
    let W = 0, H = 0, raf = 0, running = false, P = [], rgb = [241, 240, 225];
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = screen.clientWidth; H = screen.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed(n) {
      P = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.2,
        r: 0.6 + Math.random() * 1.6, o: 0.08 + Math.random() * 0.3, ph: Math.random() * 6.28
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgb(${rgb})`;
      for (const p of P) {
        if (!reduceMotion.matches) { p.x = (p.x + p.vx + W) % W; p.y = (p.y + p.vy + H) % H; p.ph += 0.02; }
        ctx.globalAlpha = p.o * (0.75 + 0.25 * Math.sin(p.ph));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running && !reduceMotion.matches) raf = requestAnimationFrame(frame);
    }

    function fmtTime(iso) {
      const [d, t] = iso.split('T');
      const [y, m, day] = d.split('-').map(Number);
      let [hh, mm] = t.split(':').map(Number);
      const ap = hh >= 12 ? 'pm' : 'am'; hh = hh % 12 || 12;
      const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
      return `${day} ${mon}, ${hh}:${String(mm).padStart(2, '0')} ${ap} IST`;
    }
    function render(d) {
      const c = aqiCategory(d.aqi);                   // same category scale and colours as the dashboard
      const name = c.cat.charAt(0) + c.cat.slice(1).toLowerCase();
      $('lv-aqi').textContent = d.aqi;
      $('lv-cat-text').textContent = name;
      $('lv-cat-dot').style.background = c.color;
      $('lv-cat-dot').style.color = c.color;
      $('lv-pm25').textContent = d.pm25 != null ? d.pm25.toFixed(1) : '—';
      $('lv-pm10').textContent = d.pm10 != null ? d.pm10.toFixed(1) : '—';
      $('lv-time').textContent = fmtTime(d.time);
      rgb = c.cat_rgb.split(',').map(Number);
      seed(Math.max(40, Math.min(520, Math.round(d.aqi * 1.2))));   // more particles = worse air
      if (reduceMotion.matches) frame();
    }
    function renderUnavailable() {
      $('lv-aqi').textContent = '—';
      $('lv-cat-text').textContent = 'Live reading unavailable right now';
      $('lv-cat-dot').style.background = 'var(--text-3)';
      ['lv-pm25', 'lv-pm10', 'lv-time'].forEach(id => $(id).textContent = '—');
    }

    window.iaShowLive = function (viaKeyboard) {
      screen.classList.remove('lv-hidden');
      size();
      if (!P.length) { rgb = [241, 240, 225]; seed(60); }
      running = true; cancelAnimationFrame(raf); frame();
      if (!cache) { $('lv-aqi').textContent = '—'; $('lv-cat-text').textContent = 'Reading the air…'; }
      load().then(render).catch(renderUnavailable);
      if (viaKeyboard) cta.focus({ preventScroll: true });
    };

    cta.addEventListener('click', (e) => {
      screen.classList.add('lv-hidden');
      loc.classList.remove('hidden');                       // existing locality screen + its entrance
      if (typeof _map !== 'undefined' && _map) setTimeout(() => _map.invalidateSize(), 60);
      if (e.detail === 0) {
        const first = loc.querySelector('.loc-card');
        if (first) first.focus({ preventScroll: true });
      }
      setTimeout(() => { running = false; cancelAnimationFrame(raf); }, 560);
    });
    window.addEventListener('resize', () => { if (running) { size(); seed(P.length || 60); } });
  })();

  // ── 4. Keyboard access for locality cards ───────────────────
  // Enter / Space trigger the card's existing click handler.
  document.querySelectorAll('.loc-card').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    const name = card.querySelector('.loc-card-name');
    if (name) {
      const label = (name.childNodes[0] ? name.childNodes[0].textContent : name.textContent).trim();
      card.setAttribute('aria-label', `Select ${label}${name.querySelector('.loc-card-badge') ? ', coming soon' : ''}`);
    }
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
})();
