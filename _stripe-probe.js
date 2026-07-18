const https = require('https');
const urls = {
  'QI00 Stronger together': 'https://buy.stripe.com/28E8wI1Xr6Mu98U9G7fQI00',
  'QI01 Donate': 'https://buy.stripe.com/14A28kby1gn43OA2dFfQI01',
  'QI02 A Stronger Opelousas': 'https://buy.stripe.com/9B614geKd2we0CoaKbfQI02',
  'QI03 We are in this together': 'https://buy.stripe.com/bJebIU31vdaS70M3hJfQI03',
  'QI04 Power a Stronger Opelousas': 'https://buy.stripe.com/bJe8wI1Xr8UC84Q6tVfQI04',
  'QI05 Building with Broussard': 'https://buy.stripe.com/eVq7sEby1fj070M05xfQI05',
  'QI06 From the Ground Up': 'https://buy.stripe.com/9B66oAeKdb2Kcl62dFfQI06',
  'QI07 Broussard for Mayor': 'https://buy.stripe.com/28E3coeKdgn40Cog4vfQI07',
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

(async () => {
  for (const [name, url] of Object.entries(urls)) {
    const html = await fetch(url);
    // Look for cents amounts near product/price config
    const cents = [...html.matchAll(/"unit_amount"\s*:\s*(\d+)/g)].map((m) => m[1]);
    const cents2 = [...html.matchAll(/unit_amount\\?":\s*(\d+)/g)].map((m) => m[1]);
    const amounts = [...html.matchAll(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g)].map((m) => m[0]);
    const usd = [...html.matchAll(/US\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g)].map((m) => m[0]);
    // stripe payment links often embed session config as JSON with "amount_total"
    const total = [...html.matchAll(/amount_total\\?":\s*(\d+)/g)].map((m) => m[1]);
    const custom = /customer_adjustment|custom.?amount|adjustable/i.test(html);
    // try find price in bootstrap
    const idx = html.indexOf('plink_');
    const snip = idx >= 0 ? html.slice(idx, idx + 400) : '';
    // Find numbers that look like dollar cents for donations: 100,500,1000,2500,5000,10000,25000,50000,100000,250000,500000,1000000
    const donationCents = [...html.matchAll(/\b(100|500|1000|2500|5000|10000|25000|50000|100000|250000|500000|1000000)\b/g)]
      .map((m) => m[1])
      .filter((v, i, a) => a.indexOf(v) === i);
    console.log('\n' + name);
    console.log('usd', usd.slice(0, 5));
    console.log('amounts', amounts.slice(0, 10));
    console.log('unit_amount', cents.slice(0, 5), cents2.slice(0, 5));
    console.log('amount_total', total.slice(0, 5));
    console.log('donation-like cents', donationCents.slice(0, 20));
    console.log('custom?', custom);
    console.log('snip', snip.replace(/\s+/g, ' ').slice(0, 300));
  }
})();
