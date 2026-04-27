// ============================
// CLOUD DATABASE CONFIG (SUPABASE)
// ============================
const SUPABASE_URL = 'https://xsuxjjvjlxenfsvdjfmq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdXhqanZqbHhlbmZzdmRqZm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjYzNzYsImV4cCI6MjA5MjgwMjM3Nn0.OX7ifLwUC2CFkiAOLbTx6NvCSyhQ0o7m01kEwmhjeJI';

let supabaseClient = null;

function initSupabase() {
  try {
    // نتحقق من وجود المكتبة أولاً لضمان عدم توقف الموقع
    if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_URL.includes('supabase.co')) {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('Cloud Sync Enabled ✅');
    }
  } catch (e) {
    console.warn('Cloud Sync Offline - Using Local Mode');
  }
}

// ============================
// TELEGRAM NOTIFICATIONS
// ============================
function getTelegramConfig() {
  return JSON.parse(localStorage.getItem('telegramConfig') || '{"token":"","chatId":""}');
}

async function sendTelegramNotification(booking) {
  const { token, chatId } = getTelegramConfig();
  if (!token || !chatId) return;
  const msg =
    `🔔 *حجز جديد - صالون حمادة دياب*\n\n` +
    `🆔 ${booking.bookingid}\n` +
    `👤 الاسم: ${booking.name}\n` +
    `📞 الهاتف: ${booking.phone}\n` +
    `✂️ الخدمة: ${booking.service}\n` +
    `📅 التاريخ: ${booking.date}\n` +
    `🕐 الوقت: ${booking.time}\n` +
    `💰 السعر: ${booking.price}₪` +
    (booking.notes ? `\n📝 ملاحظات: ${booking.notes}` : '');
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        disable_notification: false // هذا يضمن وصول الرسالة بصوت
      })
    });
  } catch (e) { console.warn('Telegram error:', e); }
}

// ============================
// SERVICES DATA
// ============================
const SERVICES = [
  { name: 'حلاقه شعر', price: 3, duration: 40, icon: '✂️', desc: 'حلاقة احترافية عصرية' },
  { name: 'لحيه', price: 2, duration: 20, icon: '🧔', desc: 'تشذيب احترافي للحية' },
  { name: 'حلاقة اطفال', price: 3, duration: 30, icon: '👦', desc: 'آمنة وسهلة للأطفال' },
  { name: 'تحديد', price: 2, duration: 15, icon: '💈', desc: 'تحديد لحية وشعر' },
  { name: 'سشوار', price: 2, duration: 15, icon: '💇', desc: 'تصفيف وسشوار' },
  { name: 'بكج كامل', price: 15, duration: 60, icon: '👑', desc: 'خدمة VIP متكاملة' },
];

const DEFAULT_REVIEWS = [
  { name: 'أحمد محمد', rating: 5, service: 'حلاقة VIP', comment: 'خدمة ممتازة والحلاقة احترافية جداً، أنصح الجميع!', date: '2026-04-20', verified: true },
  { name: 'خالد العمري', rating: 5, service: 'حلاقة + لحية', comment: 'أفضل صالون جربته، الأسعار مناسبة والحلاق محترف.', date: '2026-04-18', verified: true },
  { name: 'سامي الحمد', rating: 4, service: 'تنظيف اللحية', comment: 'خدمة سريعة ورائعة، سأعود قريباً.', date: '2026-04-15', verified: false },
];

// ============================
// BOOKING STATE
// ============================
let selectedService = null;
let selectedSlot = null;
let currentStep = 1;
let countdownInterval = null;
let selectedRating = 5;

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', () => {
  initSupabase(); // تهيئة صامتة لا تعطل الموقع
  renderServicesGrid();
  renderBookingServices();
  renderReviews();
  fillServiceOptions();
  checkOpenStatus();
  checkBookingEnabled();
  setMinDate();
  initRatingStars();
  applyWarmMode();
  setInterval(checkOpenStatus, 60000);
});

function applyWarmMode() {
  const h = new Date().getHours();
  if (h >= 19 || h < 1) document.body.classList.add('warm');
}

function checkOpenStatus() {
  const h = new Date().getHours();
  const el = document.getElementById('openStatus');
  if (!el) return;
  const isOpen = h >= 13 && h < 23;
  el.innerHTML = isOpen
    ? '<span class="flex items-center gap-2 text-green-400"><span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> مفتوح الآن (حتى 11:00 م)</span>'
    : '<span class="flex items-center gap-2 text-red-400"><span class="w-2 h-2 bg-red-500 rounded-full"></span> مغلق الآن (يفتح 1:00 م)</span>';
}

function checkBookingEnabled() {
  const s = JSON.parse(localStorage.getItem('salonSettings') || '{"bookingOpen":true}');
  const banner = document.getElementById('closedBanner');
  const box = document.getElementById('bookingBox');
  if (!banner || !box) return;
  if (!s.bookingOpen) {
    banner.classList.remove('hidden');
    box.classList.add('hidden');
    if (s.closedReason) document.getElementById('closedMsg').textContent = s.closedReason;
  } else {
    banner.classList.add('hidden');
    box.classList.remove('hidden');
  }
}

function renderServicesGrid() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-card glass rounded-2xl p-4 border border-transparent hover:border-gold/40 cursor-pointer"
         onclick="scrollToBookingAndSelect('${s.name}')">
      <div class="text-3xl mb-2">${s.icon}</div>
      <h3 class="font-bold text-sm mb-1">${s.name}</h3>
      <p class="text-gray-400 text-xs mb-2">${s.desc}</p>
      <div class="flex items-center justify-between mt-auto">
        <span class="text-gold font-black text-base">${s.price}₪</span>
        <span class="text-xs text-gray-500">⏱ ${s.duration}د</span>
      </div>
    </div>
  `).join('');
}

function scrollToBookingAndSelect(name) {
  const el = document.getElementById('booking');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => selectBookingService(name), 600);
}

function renderBookingServices() {
  const grid = document.getElementById('bookingServices');
  if (!grid) return;
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-card glass rounded-xl p-3 border border-transparent text-center"
         id="bsv-${s.name.replace(/\s/g, '_')}"
         onclick="selectBookingService('${s.name}')">
      <div class="text-2xl mb-1">${s.icon}</div>
      <p class="text-xs font-bold">${s.name}</p>
      <p class="text-gold text-xs font-black mt-1">${s.price}₪</p>
    </div>
  `).join('');
}

function selectBookingService(name) {
  selectedService = SERVICES.find(s => s.name === name);
  document.querySelectorAll('.service-card[id^="bsv-"]').forEach(c => c.classList.remove('selected'));
  const el = document.getElementById('bsv-' + name.replace(/\s/g, '_'));
  if (el) el.classList.add('selected');
  const nextBtn = document.getElementById('step1Next');
  if (nextBtn) nextBtn.classList.remove('hidden');
}

function setMinDate() {
  const d = document.getElementById('bookDate');
  if (d) d.min = new Date().toISOString().split('T')[0];
}

function nextStep(n) {
  if (n === 2 && !selectedService) { showToast('اختر الخدمة أولاً', 'warn'); return; }
  if (n === 3 && !selectedSlot) { showToast('اختر وقتاً متاحاً', 'warn'); return; }
  currentStep = n;
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + n).classList.add('active');
  const pct = { 1: 33, 2: 66, 3: 100, 4: 100 };
  document.getElementById('progressBar').style.width = pct[n] + '%';
  const labels = { 1: 'الخطوة 1: اختر الخدمة', 2: 'الخطوة 2: اختر الوقت', 3: 'الخطوة 3: بياناتك', 4: '✓ تم الحجز' };
  const nums = { 1: '1 / 3', 2: '2 / 3', 3: '3 / 3', 4: '✓' };
  document.getElementById('stepLabel').textContent = labels[n];
  document.getElementById('stepNum').textContent = nums[n];
  if (n === 3) showBookingSummary();
}

function showBookingSummary() {
  const d = document.getElementById('bookDate').value;
  const summary = document.getElementById('bookingSummary');
  if (!summary) return;
  summary.innerHTML = `
    <div class="space-y-1 text-right">
      <p>🛠 <strong>الخدمة:</strong> ${selectedService.icon} ${selectedService.name}</p>
      <p>💰 <strong>السعر:</strong> ${selectedService.price}₪</p>
      <p>⏱ <strong>المدة:</strong> ${selectedService.duration} دقيقة</p>
      <p>📅 <strong>التاريخ:</strong> ${formatDate(d)}</p>
      <p>🕐 <strong>الوقت:</strong> ${selectedSlot}</p>
    </div>`;
}

async function loadSlots() {
  const date = document.getElementById('bookDate').value;
  if (!date) return;
  selectedSlot = null;
  const nextBtn = document.getElementById('step2Next');
  if (nextBtn) nextBtn.classList.add('hidden');

  // مزامنة المواعيد من السحابة لتعطيل المكرر
  const allBookings = await getBookings();
  const bookings = allBookings.filter(b => b.date === date && b.status !== 'cancel');
  const slots = generateSlots();
  const html = slots.map(slot => {
    const disabled = isSlotTaken(slot, date, bookings);
    return `<button class="slot-btn glass rounded-xl py-2 text-sm border border-dark-3 ${disabled ? 'disabled' : ''}"
      ${disabled ? 'disabled' : `onclick="selectSlot('${slot}', this)"`}>${slot}</button>`;
  }).join('');
  const container = document.getElementById('slotsContainer');
  if (container) container.innerHTML = `<div class="grid grid-cols-4 gap-2">${html}</div>`;
}

function generateSlots() {
  const slots = [];
  for (let h = 13; h <= 22; h++) {
    slots.push(pad(h) + ':00');
    if (h < 22) slots.push(pad(h) + ':30');
  }
  return slots;
}

function selectSlot(slot, el) {
  selectedSlot = slot;
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  const nextBtn = document.getElementById('step2Next');
  if (nextBtn) nextBtn.classList.remove('hidden');
}

function isSlotTaken(slot, date, bookings) {
  if (!selectedService) return false;
  const [sh, sm] = slot.split(':').map(Number);
  const slotStart = sh * 60 + sm;
  const slotEnd = slotStart + selectedService.duration;
  return bookings.some(b => {
    const sv = SERVICES.find(s => s.name === b.service);
    const dur = sv ? sv.duration : 30;
    const [bh, bm] = b.time.split(':').map(Number);
    const bStart = bh * 60 + bm;
    const bEnd = bStart + dur;
    return slotStart < bEnd && slotEnd > bStart;
  });
}

async function confirmBooking() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  if (!name) { showToast('أدخل اسمك', 'warn'); return; }
  if (!phone) { showToast('أدخل رقم الهاتف', 'warn'); return; }

  const booking = {
    bookingid: 'HMD-' + Date.now(),
    name, phone,
    service: selectedService.name,
    price: selectedService.price,
    date: document.getElementById('bookDate').value,
    time: selectedSlot,
    notes: document.getElementById('custNotes').value.trim(),
    status: 'new',
    createdat: new Date().toISOString(),
  };

  await saveBookings(booking);
  sendTelegramNotification(booking);
  showSuccessStep(booking);
  startCountdown(booking.date, booking.time);
  setWhatsappLink(booking);
}

function showSuccessStep(b) {
  const info = document.getElementById('successInfo');
  if (info) {
    info.innerHTML = `
      <div class="space-y-1 text-sm">
        <p>🆔 <strong>رقم الحجز:</strong> <span class="text-gold">${b.bookingid}</span></p>
        <p>👤 <strong>الاسم:</strong> ${b.name}</p>
        <p>🛠 <strong>الخدمة:</strong> ${b.service}</p>
        <p>📅 <strong>الموعد:</strong> ${formatDate(b.date)} – ${b.time}</p>
        <p>💰 <strong>السعر:</strong> ${b.price}₪</p>
      </div>`;
  }
  nextStep(4);
}

function startCountdown(dateStr, timeStr) {
  clearInterval(countdownInterval);
  const target = new Date(dateStr + 'T' + timeStr + ':00').getTime();
  countdownInterval = setInterval(() => {
    const now = new Date().getTime();
    const diff = target - now;
    if (diff <= 0) {
      clearInterval(countdownInterval);
      document.getElementById('countdownTimer').textContent = "حان الموعد! ✨";
      return;
    }
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    document.getElementById('countdownTimer').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, 1000);
}

function setWhatsappLink(b) {
  const msg = encodeURIComponent(
    `مرحباً صالون حمادة دياب، قمت بحجز موعد:\n\n` +
    `👤 الاسم: ${b.name}\n` +
    `✂️ الخدمة: ${b.service}\n` +
    `📅 الموعد: ${formatDate(b.date)} في ${b.time}\n` +
    `💰 السعر: ${b.price}₪\n\n` +
    `📞 للاستفسار: 0781180125`
  );
  const link = document.getElementById('whatsappShare');
  if (link) link.href = `https://wa.me/962${b.phone.replace(/^0/, '')}?text=${msg}`;
}

function resetBooking() {
  selectedService = null;
  selectedSlot = null;
  document.getElementById('custName').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('custNotes').value = '';
  document.getElementById('bookDate').value = '';
  document.getElementById('slotsContainer').textContent = 'اختر التاريخ أولاً';
  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
  nextStep(1);
}

// ============================
// REVIEWS
// ============================
function getReviews() { return JSON.parse(localStorage.getItem('hamzaSalonReviews') || JSON.stringify(DEFAULT_REVIEWS)); }
function saveReviews(r) { localStorage.setItem('hamzaSalonReviews', JSON.stringify(r)); }

function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  const reviews = getReviews();
  grid.innerHTML = reviews.map(r => `
    <div class="glass p-6 rounded-2xl border border-dark-3">
      <div class="flex justify-between items-start mb-4">
        <div><p class="font-bold text-sm">${r.name}</p><p class="text-xs text-gold">${r.service}</p></div>
        <div class="text-gold text-xs"> ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} </div>
      </div>
      <p class="text-gray-400 text-sm leading-relaxed mb-4">"${r.comment}"</p>
      <div class="flex justify-between items-center text-[10px] text-gray-600">
        <span>${r.date}</span>
        ${r.verified ? '<span class="text-green-500/70">✓ حجز مؤكد</span>' : ''}
      </div>
    </div>
  `).join('');
}

function fillServiceOptions() {
  const sel = document.getElementById('revService');
  if (!sel) return;
  sel.innerHTML = '<option value="">اختر الخدمة...</option>' + SERVICES.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
}

function initRatingStars() {
  const stars = document.querySelectorAll('.star-pick');
  stars.forEach(s => {
    s.addEventListener('click', () => {
      selectedRating = parseInt(s.dataset.v);
      updateStarDisplay();
    });
  });
  updateStarDisplay();
}

function updateStarDisplay() {
  const stars = document.querySelectorAll('.star-pick');
  stars.forEach(s => {
    s.style.color = parseInt(s.dataset.v) <= selectedRating ? '#D4AF37' : '#333';
  });
}

function submitReview() {
  const name = document.getElementById('revName').value.trim();
  const comment = document.getElementById('revComment').value.trim();
  const service = document.getElementById('revService').value;
  if (!name || !comment) { showToast('أدخل الاسم والتعليق', 'warn'); return; }
  const reviews = getReviews();
  reviews.unshift({ name, rating: selectedRating, service: service || 'خدمة عامة', comment, date: new Date().toISOString().split('T')[0], verified: false });
  saveReviews(reviews);
  document.getElementById('revName').value = '';
  document.getElementById('revComment').value = '';
  selectedRating = 5; updateStarDisplay();
  renderReviews();
  showToast('شكراً على تقييمك! 🌟', 'ok');
}

// ============================
// STORAGE HELPERS (CLOUD SYNC)
// ============================
async function getBookings() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('bookings').select('*');
      if (!error && data) {
        localStorage.setItem('hamzaSalonBookings', JSON.stringify(data));
        return data;
      }
    } catch (e) { console.error('DB Fetch Error'); }
  }
  return JSON.parse(localStorage.getItem('hamzaSalonBookings') || '[]');
}

async function saveBookings(booking) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('bookings').insert([booking]);
      if (error) console.error('Cloud Save Error:', error);
    } catch (e) { console.error('DB Save Error'); }
  }
  const all = JSON.parse(localStorage.getItem('hamzaSalonBookings') || '[]');
  all.push(booking);
  localStorage.setItem('hamzaSalonBookings', JSON.stringify(all));
}

// ============================
// UTILS
// ============================
function pad(n) { return n.toString().padStart(2, '0'); }
function showToast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.borderColor = type === 'warn' ? 'rgba(239,68,68,0.4)' : 'rgba(212,175,55,0.4)';
  t.style.color = type === 'warn' ? '#f87171' : '#D4AF37';
  setTimeout(() => { t.style.opacity = '0'; }, 2500);
}
function formatDate(str) {
  if (!str) return '';
  return new Date(str + 'T00:00:00').toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
