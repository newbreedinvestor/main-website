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

// Calendar links — auto-target the upcoming Tuesday 6 PM ET (rolls to next week once Tue 6 PM ET passes)
(function() {
  const gcalLink = document.getElementById('gcal-link');
  if (!gcalLink) return; // Only run on thank-you page

  // Compute upcoming Tuesday in America/New_York, regardless of visitor's local TZ
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false, weekday: 'short'
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const etDow = dowMap[parts.weekday];
  const etHour = parseInt(parts.hour, 10);
  let daysUntil = (2 - etDow + 7) % 7;
  if (etDow === 2 && etHour >= 18) daysUntil = 7; // past Tue 6 PM ET → next week

  const target = new Date(Date.UTC(
    parseInt(parts.year, 10),
    parseInt(parts.month, 10) - 1,
    parseInt(parts.day, 10) + daysUntil
  ));
  const year  = target.getUTCFullYear().toString();
  const month = String(target.getUTCMonth() + 1).padStart(2, '0');
  const date  = String(target.getUTCDate()).padStart(2, '0');

  const zoomUrl = 'https://us06web.zoom.us/j/86932176429?pwd=Zpd2mQ9R6tNs11Z8ClNfPwaNRBo9qO.1';
  const meetingId = '869 3217 6429';

  // Local clock time; Google Calendar handles the timezone param below
  const startDate = `${year}${month}${date}T180000`;
  const endDate = `${year}${month}${date}T190000`;

  const title = encodeURIComponent('New Breed Investors - Free Live Training');
  const details = encodeURIComponent(`Join the free 60-minute live training on how investors are replacing overpriced PPC/PPL leads with 3-5 off-market deals per month.\n\nJoin Zoom Meeting:\n${zoomUrl}\n\nMeeting ID: ${meetingId}`);
  const location = encodeURIComponent(zoomUrl);
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
    const isoStart = `${year}-${month}-${date}T18:00:00`;
    const isoEnd = `${year}-${month}-${date}T19:00:00`;
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
      `URL:${zoomUrl}`,
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

      // Hand the registrant's identity to the thank-you page via sessionStorage
      // (not URL params, so PII stays out of GTM/Clarity URL logs).
      // 'nbi_just_registered' lets the thank-you page fire the Meta Lead event
      // exactly once — email/SMS reminder clicks to that page won't re-fire it.
      try {
        sessionStorage.setItem('nbi_contact', JSON.stringify({
          first_name: formData.get('first_name') || '',
          last_name: formData.get('last_name') || '',
          email: formData.get('email') || '',
          phone: formData.get('phone') || ''
        }));
        sessionStorage.setItem('nbi_just_registered', '1');
      } catch (storageErr) { /* private mode — page still works, Lead just won't fire */ }

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
