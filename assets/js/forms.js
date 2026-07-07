/**
 * Submits the Contact and Tribute forms to the Google Apps Script
 * web app, which logs the entry to a Sheet and emails the chapter.
 * Replace SCRIPT_URL with the deployment URL from Apps Script.
 */
(function () {
  const SCRIPT_URL = '/api/submit-form';

  function setState(form, state) {
    form.setAttribute('data-state', state);
  }

  function showMessage(form, type, text) {
    let box = form.querySelector('.form-status');
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-status';
      form.appendChild(box);
    }
    box.className = 'form-status form-status-' + type;
    box.textContent = text;
    box.hidden = false;
  }

  function clearMessage(form) {
    const box = form.querySelector('.form-status');
    if (box) box.hidden = true;
  }

  function showSuccessPanel(form) {
    const panel = document.createElement('div');
    panel.className = 'form-success-panel';
    panel.innerHTML =
      '<div class="form-success-icon">' +
        '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12.5L9.5 18L20 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</div>' +
      '<div class="form-success-title">Message Sent</div>' +
      '<p class="form-success-text">Thank you for reaching out. A chapter officer will review your submission and get back to you soon.</p>';

    const wrap = form.closest('.form-wrap') || form.closest('.submit-inner');
    if (wrap) {
      wrap.innerHTML = '';
      wrap.appendChild(panel);
    } else {
      form.replaceWith(panel);
    }
  }

  async function submitForm(form, formType, buildPayload) {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button.textContent;
    setState(form, 'loading');
    clearMessage(form);
    button.disabled = true;
    button.textContent = 'Sending...';

    // Apps Script round trips can run several seconds past what feels
    // instant, so reassure the sender it's still working rather than
    // let the button sit on "Sending..." looking stalled or broken.
    const stillWorkingTimer = setTimeout(function () {
      button.textContent = 'Still sending...';
      showMessage(form, 'pending', 'This is taking a little longer than usual. Your message is still on its way, no need to resubmit.');
    }, 5000);

    const honeypot = form.querySelector('input[name="website"]');
    const payload = Object.assign(
      { formType: formType, website: honeypot ? honeypot.value : '' },
      buildPayload()
    );

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      let result;
      try {
        result = JSON.parse(raw);
      } catch (parseErr) {
        result = null;
      }

      if (result && result.result !== 'success') {
        const submissionError = new Error(result.message || 'Submission failed');
        submissionError.code = result.code;
        throw submissionError;
      }

      clearTimeout(stillWorkingTimer);
      setState(form, 'success');
      button.textContent = 'Sent';
      showSuccessPanel(form);
    } catch (err) {
      clearTimeout(stillWorkingTimer);
      const isRateLimit = /^RATE_LIMIT:/.test(err.message || '');
      const isTimeout = err.code === 'TIMEOUT';
      setState(form, 'error');
      showMessage(
        form,
        'error',
        isRateLimit
          ? 'Looks like this was just submitted. If you already saw a confirmation, no need to resend, we received it.'
          : isTimeout
          ? 'The form handler is responding slowly. Your message may still have gone through, please wait a moment before resubmitting, or email us directly at ftbragg555pia@gmail.com.'
          : 'Something went wrong. Please try again, or email us directly at ftbragg555pia@gmail.com.'
      );
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  const contactForm = document.querySelector('.form-wrap form');
  if (contactForm && !contactForm.id) {
    contactForm.id = 'contactForm';
  }
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm(contactForm, 'contact', () => ({
        name: contactForm.querySelector('#contact-name').value.trim(),
        email: contactForm.querySelector('#contact-email').value.trim(),
        phone: contactForm.querySelector('#contact-phone').value.trim(),
        subject: contactForm.querySelector('#contact-subject').value,
        message: contactForm.querySelector('#contact-message').value.trim()
      }));
    });
  }

  const tributeForm = document.getElementById('tributeForm');
  if (tributeForm) {
    tributeForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm(tributeForm, 'tribute', () => ({
        veteranName: tributeForm.querySelector('#veteranName').value.trim(),
        rank: tributeForm.querySelector('#rank').value.trim(),
        yearBorn: tributeForm.querySelector('#yearBorn').value.trim(),
        yearPassed: tributeForm.querySelector('#yearPassed').value.trim(),
        tribute: tributeForm.querySelector('#tribute').value.trim(),
        submitterName: tributeForm.querySelector('#submitterName').value.trim(),
        submitterEmail: tributeForm.querySelector('#submitterEmail').value.trim(),
        relationship: tributeForm.querySelector('#relationship').value.trim()
      }));
    });
  }
})();
