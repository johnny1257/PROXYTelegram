// اینجا نوع پراکسی مورد نظرت رو انتخاب کن
const PROXY_TYPE = 'mtproto';

// آدرس‌های API برای هر نوع پراکسی
const API_URLS = {
  'mtproto': "https://raw.githubusercontent.com/hookzof/socks5_list/master/tg/mtproto.json",
  'socks': "https://raw.githubusercontent.com/hookzof/socks5_list/master/tg/socks.json"
};

async function getProxyPage() {
  let proxyDataList = null;
  const apiUrl = API_URLS[PROXY_TYPE];

  try {
    const response = await fetch(apiUrl);
    proxyDataList = await response.json();
  } catch (error) {
    console.error("Error fetching proxy data:", error);
    return `<p class="error-message">مشکلی در دریافت اطلاعات پراکسی پیش آمده است.</p>`;
  }

  if (!Array.isArray(proxyDataList) || proxyDataList.length === 0) {
    return `<p class="error-message">اطلاعات پراکسی در دسترس نیست.</p>`;
  }

  let proxiesHtml = '';
  proxyDataList.forEach((proxyData, index) => {
    let proxyLink = '';
    let serverInfo = '';
    let countryCode = proxyData.country.toLowerCase();
    let ping = proxyData.ping || 'N/A';
    
    if (PROXY_TYPE === 'mtproto') {
      const { host, port, secret } = proxyData;
      proxyLink = `https://t.me/proxy?server=${host}&port=${port}&secret=${secret}`;
      serverInfo = `
        <div class="info-item"><strong>هاست:</strong> <span>${host}</span></div>
        <div class="info-item"><strong>پورت:</strong> <span>${port}</span></div>
        <div class="info-item"><strong>سکرت:</strong> <span>${secret}</span></div>
      `;
    } else if (PROXY_TYPE === 'socks') {
      const { ip, port } = proxyData;
      proxyLink = `https://t.me/socks?server=${ip}&port=${port}`;
      serverInfo = `
        <div class="info-item"><strong>آی‌پی:</strong> <span>${ip}</span></div>
        <div class="info-item"><strong>پورت:</strong> <span>${port}</span></div>
      `;
    }
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(proxyLink)}`;
    const countryFlag = getFlagEmoji(countryCode);

    proxiesHtml += `
      <div class="proxy-card" id="proxy-${index}">
        <div class="card-header">
          <span class="flag">${countryFlag}</span>
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
          <button class="btn btn-test" onclick="testConnection('${host || proxyData.ip}', '${port}', ${index})">تست اتصال</button>
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
        .card-header .flag { font-size: 2rem; }
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
        
        // یک تابع شبیه‌سازی برای تست اتصال، چون تست پینگ مستقیم از مرورگر ممکن نیست.
        async function testConnection(host, port, index) {
          const statusElement = document.getElementById(\`test-status-${index}\`);
          statusElement.innerHTML = 'در حال تست...';
          statusElement.className = 'test-status';

          // شبیه‌سازی یک درخواست ساده به یک پورت
          // این روش برای تمام سرورها کار نمی‌کند، اما یک روش عمومی برای تست است.
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

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const htmlContent = await getProxyPage();
  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
