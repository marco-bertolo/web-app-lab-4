const express = require('express');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

function bytesToGB(bytes) {
  return (bytes / (1024 ** 3)).toFixed(2);
}

function getCpuLoadPercent() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - Math.round((idle / total) * 100);
  return Math.max(0, Math.min(100, usage));
}

app.get('/', (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cookiePercent = Math.round((usedMem / totalMem) * 100);
  const cpuLoad = getCpuLoadPercent();
  const cpus = os.cpus();

  const cookieMood = cpuLoad < 50
    ? { emoji: '🍪', label: 'Cookie Feliz', mood: 'happy' }
    : { emoji: '🫠', label: 'Cookie a Derreter', mood: 'melting' };

  const data = {
    hostname: os.hostname(),
    platform: `${os.platform()} (${os.arch()})`,
    cpuModel: cpus[0] ? cpus[0].model : 'Unknown',
    cpuCount: cpus.length,
    totalMemGB: bytesToGB(totalMem),
    freeMemGB: bytesToGB(freeMem),
    usedMemGB: bytesToGB(usedMem),
    cookiePercent,
    cpuLoad,
    cookieMood,
    uptimeMin: Math.floor(os.uptime() / 60)
  };

  res.render('index', data);
});

app.get('/api/stats', (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    cpuLoad: getCpuLoadPercent(),
    cookiePercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🍪 Lofi & Cookies Dashboard a correr na porta ${PORT}`);
});
