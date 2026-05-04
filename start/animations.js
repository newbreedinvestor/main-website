// Scroll reveal animations
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Sticky CTA bar — shows after hero scrolls out of view
const heroSection = document.querySelector('.hero, .thankyou-hero');
const ctaBar = document.getElementById('ctaBar');

if (heroSection && ctaBar) {
  const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      ctaBar.classList.toggle('visible', !entry.isIntersecting);
    });
  }, { threshold: 0 });
  ctaObserver.observe(heroSection);
}

// Calendar dropdown toggle
const calendarToggle = document.getElementById('calendarToggle');
const calendarDropdown = document.querySelector('.calendar-dropdown');

if (calendarToggle && calendarDropdown) {
  calendarToggle.addEventListener('click', () => {
    calendarDropdown.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!calendarDropdown.contains(e.target)) {
      calendarDropdown.classList.remove('open');
    }
  });
}

// Calendar links — dynamically generate for next Thursday 7 PM EST
(function() {
  const gcalLink = document.getElementById('gcal-link');
  if (!gcalLink) return; // Only run on thank-you page

  // Find next Thursday
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 4=Thu
  let daysUntilThursday = (4 - day + 7) % 7;
  if (daysUntilThursday === 0) daysUntilThursday = 7; // If today is Thursday, get next one
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);

  // Event: 7:00 PM - 8:00 PM EST (UTC-5)
  // Set to 7 PM EST = midnight UTC next day... actually let's use explicit UTC offset
  // 7:00 PM EST = 00:00 UTC next day (during EDT it's 23:00 UTC same day)
  // Use America/New_York: 7 PM ET
  const year = nextThursday.getFullYear();
  const month = String(nextThursday.getMonth() + 1).padStart(2, '0');
  const date = String(nextThursday.getDate()).padStart(2, '0');

  // For URL params, use EST (UTC-5): 7PM EST = 00:00 UTC next day
  // But Google Calendar handles timezone param, so we use local date + time
  const startDate = `${year}${month}${date}T190000`;
  const endDate = `${year}${month}${date}T200000`;

  const title = encodeURIComponent('New Breed Investors - Free Live Training');
  const details = encodeURIComponent('Join the free 60-minute live training on how investors are replacing overpriced PPC/PPL leads with 3-5 off-market deals per month.\n\nZoom link will be sent via email.');
  const location = encodeURIComponent('Zoom (link in email)');
  const timezone = encodeURIComponent('America/New_York');

  // Google Calendar
  gcalLink.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}&ctz=${timezone}`;

  // Yahoo Calendar
  // Yahoo uses: ST=start, ET=end in format YYYYMMDDTHHMMSS, and dur for duration
  const yahooLink = document.getElementById('yahoo-link');
  if (yahooLink) {
    yahooLink.href = `https://calendar.yahoo.com/?v=60&title=${title}&st=${startDate}&et=${endDate}&desc=${details}&in_loc=${location}`;
  }

  // Outlook Web
  const outlookLink = document.getElementById('outlook-link');
  if (outlookLink) {
    const isoStart = `${year}-${month}-${date}T19:00:00`;
    const isoEnd = `${year}-${month}-${date}T20:00:00`;
    outlookLink.href = `https://outlook.live.com/calendar/0/action/compose?subject=${title}&startdt=${isoStart}&enddt=${isoEnd}&body=${details}&location=${location}`;
  }

  // Apple / ICS download
  const icsLink = document.getElementById('ics-link');
  if (icsLink) {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NBI//Webinar//EN',
      'BEGIN:VEVENT',
      `DTSTART;TZID=America/New_York:${startDate}`,
      `DTEND;TZID=America/New_York:${endDate}`,
      `SUMMARY:${decodeURIComponent(title)}`,
      `DESCRIPTION:${decodeURIComponent(details).replace(/\n/g, '\\n')}`,
      `LOCATION:${decodeURIComponent(location)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    icsLink.href = URL.createObjectURL(blob);
  }
})();

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    // Toggle clicked
    if (!isOpen) item.classList.add('open');
  });
});

// Registration form — POST to GHL webhook, then redirect to thank-you page
const registrationForm = document.getElementById('registration-form');

if (registrationForm) {
  registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const formError = document.getElementById('form-error');
    const originalText = submitBtn.textContent;

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    submitBtn.style.opacity = '0.7';
    formError.style.display = 'none';

    const formData = new FormData(registrationForm);
    const params = new URLSearchParams();
    params.append('first_name', formData.get('first_name'));
    params.append('last_name', formData.get('last_name'));
    params.append('email', formData.get('email'));
    params.append('phone', formData.get('phone'));

    try {
      await fetch('https://services.leadconnectorhq.com/hooks/DtZlCxzIoAvbNURI3XeL/webhook-trigger/55786e7f-1752-4720-8583-cb2f6fb7e6d9', {
        method: 'POST',
        body: params,
        mode: 'no-cors'
      });

      // Redirect to thank-you page
      window.location.href = 'thankyou.html';
    } catch (err) {
      // Even with no-cors, fetch won't throw on success
      // If we get here, there's a real network error
      formError.textContent = 'Something went wrong. Please try again.';
      formError.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.style.opacity = '1';
    }
  });
}
