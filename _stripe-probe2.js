const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/json',
      },
    }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
    }).on('error', reject);
  });
}

const codes = [
  ['QI00', '28E8wI1Xr6Mu98U9G7fQI00', 'Stronger together'],
  ['QI01', '14A28kby1gn43OA2dFfQI01', 'Donate'],
  ['QI02', '9B614geKd2we0CoaKbfQI02', 'A Stronger Opelousas'],
  ['QI03', 'bJebIU31vdaS70M3hJfQI03', 'We are in this together'],
  ['QI04', 'bJe8wI1Xr8UC84Q6tVfQI04', 'Power a Stronger Opelousas'],
  ['QI05', 'eVq7sEby1fj070M05xfQI05', 'Building with Broussard'],
  ['QI06', '9B66oAeKdb2Kcl62dFfQI06', 'From the Ground Up'],
  ['QI07', '28E3coeKdgn40Cog4vfQI07', 'Broussard for Mayor'],
];

(async () => {
  // First scrape one page for API endpoint patterns
  const page = await get('https://buy.stripe.com/' + codes[7][1]);
  const apiHits = [...page.body.matchAll(/https:\/\/[^"'\s]+stripe[^"'\s]*/g)].map((m) => m[0]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 30);
  console.log('API-like URLs found:', apiHits.length);
  apiHits.forEach((u) => console.log(u));

  // Look for payment_pages or init paths
  const pathHits = [...page.body.matchAll(/\/v1\/[a-zA-Z0-9_\/{}]+/g)].map((m) => m[0]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 40);
  console.log('\nAPI paths:', pathHits);

  // Try known Stripe buy page bootstrap endpoint patterns
  for (const [tag, code, name] of codes) {
    const candidates = [
      `https://merchant-ui-api.stripe.com/payment-links/${code}`,
      `https://buy.stripe.com/${code}`,
      `https://api.stripe.com/v1/payment_links/${code}`,
    ];
    // From HTML, payment link sessions often use:
    // https://buy.stripe.com/i/... 
    const iPaths = [...page.body.matchAll(/buy\.stripe\.com\/(i\/[^"'\s]+)/g)].map((m) => m[1]);
    console.log('\n' + tag + ' ' + name);
    if (tag === 'QI07') console.log('iPaths sample', iPaths.slice(0, 5));
  }

  // Extract serialized state: look for "line_item" or product name next to numbers in HTML
  for (const [tag, code, name] of codes) {
    const html = (await get('https://buy.stripe.com/' + code)).body;
    // Stripe embeds SSR props sometimes as JSON with escaped quotes
    const m = html.match(/"name":"(Broussard[^"]*|Donate|Stronger[^"]*|From[^"]*|Building[^"]*|Power[^"]*|We are[^"]*|A Stronger[^"]*)"/);
    const priceMatches = [...html.matchAll(/"(?:unit_amount|amount|price|total)":(\d+)/g)].slice(0, 20);
    // Also search for 100000 (1000 dollars in cents)
    const has1000 = html.includes('100000') || html.includes('1,000') || html.includes('1000.00');
    const has250 = html.includes('25000') || html.includes('"250"');
    const has50 = html.includes('5000');
    console.log(tag, name, 'nameMatch', m && m[1], 'prices', priceMatches.map(x => x[0]).slice(0, 8), 'has1000', has1000);
  }
})();
