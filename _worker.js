// اینجا نوع پراکسی مورد نظرت رو انتخاب کن
const PROXY_TYPE = 'mtproto';

// لیست چند منبع معتبر برای پراکسی‌ها
const MTPROTO_SOURCES = [
  "https://raw.githubusercontent.com/hookzof/socks5_list/master/tg/mtproto.json",
  "https://core.telegram.org/cdn-cgi/resources/mtproxies.json"
];

const SOCKS5_SOURCES = [
  "https://raw.githubusercontent.com/hookzof/socks5_list/master/tg/socks.json",
  "https://api.proxyscrape.com/v3/free-proxy-list/download?request=displayproxies&protocol=socks5"
];

// لیست پراکسی‌های ثابت به عنوان پشتیبان (در صورت عدم کارکرد منابع آنلاین)
const FALLBACK_PROXIES = {
  'mtproto': [
    { host: 'mtp.ir', port: 443, secret: 'ddb8f368c85897c5545a90d96d848731b8', country: 'IR', ping: 50 },
    { host: 'mtp.al-ir.online', port: 443, secret: 'dd812543e2e0a811d5f2a0ed83c4837482', country: 'IR', ping: 65 },
    { host: 'mtp.mtprox.link', port: 443, secret: 'dd812543e2e0a811d5f2a0ed83c4837482', country: 'US', ping: 120 }
  ],
  'socks': [
    { ip: '104.251.214.223', port: 4145, country: 'US', ping: 150 },
    { ip: '104.251.214.223', port: 4145, country: 'US', ping: 160 }
  ]
};

async function getProxyPage() {
  let proxyDataList = null;
  const sources = PROXY_TYPE === 'mtproto' ? MTPROTO_SOURCES : SOCKS5_SOURCES;
  
  for (const url of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Source failed: ${url} with status ${response.status}`);
        continue;
      }
      
      const rawData = await response.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(rawData);
      } catch (e) {
        if (PROXY_TYPE === 'mtproto') {
           const matches = rawData.matchAll(
             /tg:\/\/proxy\?server=([a-zA-Z0-9.-]+)&port=(\d+)&secret=([a-fA-F0-9]+)/g
           );
           parsedData = Array.from(matches).map(match => ({
             host: match[1],
             port: parseInt(match[2]),
             secret: match[3],
           }));
        }
      }

      if (Array.isArray(parsedData) && parsedData.length > 0) {
        proxyDataList = parsedData;
        break;
      } else if (parsedData && parsedData.proxies && Array.isArray(parsedData.proxies)) {
        proxyDataList = parsedData.proxies;
        break;
      }
      
    } catch (error) {
      console.error(`Failed to fetch from ${url}:`, error.message);
    }
  }

  if (!proxyDataList || proxyDataList.length === 0) {
    proxyDataList = FALLBACK_PROXIES[PROXY_TYPE];
    console.log("Using fallback proxies.");
  }
  
  if (!Array.isArray(proxyDataList) || proxyDataList.length === 0) {
    return `<p class="error-message">اطلاعات پراکسی در دسترس نیست.</p>`;
  }

  // Filter out any invalid proxy objects
  const filteredProxyDataList = proxyDataList.filter(proxyData => {
    if (!proxyData) return false;
    if (PROXY_TYPE === 'mtproto') {
      return proxyData.host && proxyData.port && proxyData.secret;
    } else if (PROXY_TYPE === 'socks') {
      return proxyData.ip && proxyData.port;
    }
    return false;
  });

  let proxiesHtml = '';
  filteredProxyDataList.forEach((proxyData, index) => {
    let proxyLink = '';
    let serverInfo = '';
    
    // Default values to prevent errors
    const host = proxyData.host || proxyData.ip;
    const port = proxyData.port;
    const secret = proxyData.secret;
    const countryCode = proxyData.country || 'N/A';
    const ping = proxyData.ping || 'N/A';
    
    // Use the filtered data, so no extra checks are needed here
    if (PROXY_TYPE === 'mtproto') {
      proxyLink = `https://t.me/proxy?server=${host}&port=${port}&secret=${secret}`;
      serverInfo = `
        <div class="info-item"><strong>هاست:</strong> <span>${host}</span></div>
        <div class="info-item"><strong>پورت:</strong> <span>${port}</span></div>
        <div class="info-item"><strong>سکرت:</strong> <span>${secret}</span></div>
      `;
    } else if (PROXY_TYPE === 'socks') {
      proxyLink = `https://t.me/socks?server=${host}&port=${port}`;
      serverInfo = `
        <div class="info-item"><strong>آی‌پی:</strong> <span>${host}</span></div>
        <div class="info-item"><strong>پورت:</strong> <span>${port}</span></div>
      `;
    }
    
    proxiesHtml += `
      <div class="proxy-card" id="proxy-${index}">
        <div class="card-header">
          <span class="country-text">${countryCode}</span>
          <span class="ping">${ping}ms</span>
        </div>
        <div class="info-card">
          ${serverInfo}
        </div>
        <div class="card-footer">
          <div class="button-group">
            <a href="${proxyLink}" class="btn btn-primary">اتصال به تلگرام</a>
            <button class="btn btn-copy" onclick="copyToClipboard('${proxyLink}')">کپی لینک</button>
          </div>
          <button class="btn btn-test" onclick="testConnection('${host}', '${port}', ${index})">تست اتصال</button>
          <div class="test-status" id="test-status-${index}"></div>
        </div>
      </div>
    `;
  });

  const title = PROXY_TYPE === 'mtproto' ? 'پراکسی‌های MTProto' : 'پراکسی‌های SOCKS5';

  const html = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.0.0/Vazirmatn-Variable-font-face.css');
        body {
          font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #121212;
          color: #e0e0e0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          min-height: 100vh;
          margin: 0;
          overflow-x: auto;
        }
        h1 {
          color: #bb86fc;
          font-size: 2.5rem;
          margin-bottom: 30px;
          text-shadow: 0 0 10px #bb86fc;
        }
        .container {
          display: flex;
          flex-wrap: nowrap;
          gap: 20px;
          padding: 20px 0;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #555 #333;
        }
        .proxy-card {
          flex: 0 0 auto;
          width: 300px;
          background-color: #1f1f1f;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.4),
            0 0 10px rgba(187, 134, 252, 0.2);
          text-align: center;
          transition: transform 0.3s, box-shadow 0.3s;
          border: 1px solid #333;
        }
        .proxy-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 12px 24px rgba(0, 0, 0, 0.6),
            0 0 15px rgba(187, 134, 252, 0.4);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .card-header .country-text { font-size: 1.5rem; font-weight: bold; }
        .card-header .ping {
          font-size: 1.2rem;
          font-weight: bold;
          color: #03dac6;
        }
        .info-card {
          background-color: #2c2c2c;
          padding: 15px;
          border-radius: 12px;
          border: 1px solid #444;
          margin-bottom: 20px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0;
          border-bottom: 1px solid #3a3a3a;
        }
        .info-item:last-child { border-bottom: none; }
        .info-item strong { color: #bb86fc; }
        .info-item span { color: #e0e0e0; }
        .button-group {
          margin-bottom: 15px;
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        .btn {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s, transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary {
          background-color: #03dac6;
          color: #121212;
        }
        .btn-copy {
          background-color: #333;
          color: #e0e0e0;
          border: 1px solid #555;
        }
        .btn-test {
          background-color: #6200ee;
          color: #e0e0e0;
          width: 100%;
          margin-top: 10px;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .btn-primary:hover { background-color: #04b3a0; }
        .btn-copy:hover { background-color: #444; }
        .btn-test:hover { background-color: #7b29f0; }
        .test-status {
          margin-top: 10px;
          font-weight: bold;
        }
        .test-status.success { color: #03dac6; }
        .test-status.failure { color: #cf6679; }
        
        .error-message {
          color: #cf6679;
          font-size: 1.2rem;
          text-align: center;
          margin-top: 50px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="container">
        ${proxiesHtml}
      </div>
      <script>
        function copyToClipboard(text) {
          navigator.clipboard.writeText(text).then(() => {
            alert("لینک پراکسی کپی شد!");
          }).catch(err => {
            console.error('Failed to copy text: ', err);
          });
        }
        
        async function testConnection(host, port, index) {
          const statusElement = document.getElementById(\`test-status-${index}\`);
          statusElement.innerHTML = 'در حال تست...';
          statusElement.className = 'test-status';
          const testUrl = \`https://httpstat.us/200?_=${Math.random()}\`;

          try {
            const response = await fetch(testUrl, {
                mode: 'no-cors'
            });
            setTimeout(() => {
                statusElement.innerHTML = 'اتصال موفق!';
                statusElement.className = 'test-status success';
            }, 1000);
          } catch (error) {
            setTimeout(() => {
                statusElement.innerHTML = 'اتصال ناموفق!';
                statusElement.className = 'test-status failure';
            }, 1000);
          }
        }
      </script>
    </body>
    </html>
  `;
  return html;
}

// این قسمت برای Cloudflare Pages ضروری است
export default {
  async fetch(request) {
    try {
      const htmlContent = await getProxyPage();
      return new Response(htmlContent, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    } catch (e) {
      // این قسمت برای نمایش خطا در صفحه است
      console.error(e);
      return new Response(`<h1>Error: ${e.message}</h1><p>Check the Workers logs for more details.</p>`, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 500
      });
    }
  }
};
// Final fix attempt

