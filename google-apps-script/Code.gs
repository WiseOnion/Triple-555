/**
 * Triple Nickle 555th PIA - Form Handler
 *
 * Handles submissions from the Contact form and the Tribute form on
 * www.555ftbraggnc.org. Each submission is appended to its own sheet
 * tab in this spreadsheet and emailed to the chapter inbox as a
 * branded HTML email (with a plain-text fallback for clients that
 * strip HTML).
 *
 * SETUP
 * 1. Create a Google Sheet. Open Extensions > Apps Script.
 * 2. Paste this file in as Code.gs (replace the default content).
 * 3. Update NOTIFY_EMAIL below if needed.
 * 4. Deploy > New deployment > Type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL and paste it into assets/js/forms.js
 *    as SCRIPT_URL on the site.
 * 6. Re-deploy (Manage deployments > Edit > New version) any time
 *    you change this file, the URL stays the same.
 */

const NOTIFY_EMAIL = 'ftbragg555pia@gmail.com';
const SITE_URL = 'https://www.555ftbraggnc.org';

const SHEET_NAMES = {
  contact: 'Contact Submissions',
  tribute: 'Tribute Submissions'
};

const CONTACT_COLUMNS = ['Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message'];
const TRIBUTE_COLUMNS = [
  'Timestamp', 'Veteran Name', 'Rank / Unit', 'Year Born', 'Year Passed',
  'Tribute', 'Submitter Name', 'Submitter Email', 'Relationship'
];

const MAX_LENGTHS = {
  name: 120, email: 200, phone: 40, subject: 60, message: 2000,
  veteranName: 120, rank: 120, yearBorn: 10, yearPassed: 10,
  submitterName: 120, submitterEmail: 200, relationship: 120, tribute: 2000
};

const SUBJECT_LABELS = {
  membership: 'Membership Inquiry',
  scholarship: 'Scholarship Program',
  events: 'Events & Tickets',
  donate: 'Donation Question',
  media: 'Media / Press',
  general: 'General Inquiry'
};

const MIN_SECONDS_BETWEEN_SUBMISSIONS = 30;
const CONTACT_REQUIRED = ['name', 'email', 'message'];
const TRIBUTE_REQUIRED = ['veteranName', 'yearPassed', 'tribute', 'submitterName', 'submitterEmail'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.website) {
      return jsonResponse({ result: 'success' });
    }

    checkRateLimit(getClientKey(data));

    const formType = data.formType;
    if (formType === 'contact') {
      handleContact(sanitize(data, CONTACT_REQUIRED));
    } else if (formType === 'tribute') {
      handleTribute(sanitize(data, TRIBUTE_REQUIRED));
    } else {
      throw new Error('Unknown form type: ' + formType);
    }

    return jsonResponse({ result: 'success' });
  } catch (err) {
    return jsonResponse({ result: 'error', message: err.message });
  }
}

function sanitize(data, requiredFields) {
  const clean = {};
  Object.keys(data).forEach(function (key) {
    let value = data[key];
    if (typeof value === 'string') {
      value = value.trim();
      const max = MAX_LENGTHS[key];
      if (max && value.length > max) value = value.slice(0, max);
    }
    clean[key] = value;
  });
  requiredFields.forEach(function (field) {
    if (!clean[field]) throw new Error('Missing required field: ' + field);
  });
  return clean;
}

function getClientKey(data) {
  const email = (data.email || data.submitterEmail || '').toLowerCase().trim();
  return email || 'anonymous';
}

function checkRateLimit(key) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'submit_' + key;
  if (cache.get(cacheKey)) {
    throw new Error('RATE_LIMIT: Your previous submission is already being processed. Please wait about 30 seconds before submitting again.');
  }
  cache.put(cacheKey, '1', MIN_SECONDS_BETWEEN_SUBMISSIONS);
}

function handleContact(data) {
  const row = [new Date(), data.name, data.email, data.phone || '', data.subject || '', data.message];
  appendRow(SHEET_NAMES.contact, CONTACT_COLUMNS, row);

  const subjectLabel = SUBJECT_LABELS[data.subject] || '';
  const fields = [
    { label: 'Name', value: data.name },
    { label: 'Email', value: data.email, link: 'mailto:' + data.email },
    { label: 'Phone', value: data.phone || '(not provided)' },
    { label: 'Subject', value: subjectLabel || '(not selected)' }
  ];

  const html = buildEmailHtml({
    kind: 'Contact Form Submission',
    heading: 'New Message',
    intro: 'A visitor submitted the contact form on www.555ftbraggnc.org. Reply directly to this email to respond.',
    fields: fields,
    messageLabel: 'Message',
    messageValue: data.message,
    replyEmail: data.email,
    replySubject: 'Re: Your message to Samuel Council Chapter 555th PIA'
  });

  const text =
    'New contact form submission from www.555ftbraggnc.org\n\n' +
    'Name: ' + data.name + '\n' +
    'Email: ' + data.email + '\n' +
    'Phone: ' + (data.phone || '(not provided)') + '\n' +
    'Subject: ' + (subjectLabel || '(not selected)') + '\n\n' +
    'Message:\n' + data.message;

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: data.email,
    subject: 'New Contact Form Submission, ' + data.name,
    body: text,
    htmlBody: html
  });
}

function handleTribute(data) {
  const row = [
    new Date(), data.veteranName, data.rank || '', data.yearBorn || '', data.yearPassed,
    data.tribute, data.submitterName, data.submitterEmail, data.relationship || ''
  ];
  appendRow(SHEET_NAMES.tribute, TRIBUTE_COLUMNS, row);

  const fields = [
    { label: 'Veteran', value: data.veteranName },
    { label: 'Rank / Unit', value: data.rank || '(not provided)' },
    { label: 'Years', value: (data.yearBorn || '?') + ' – ' + data.yearPassed },
    { label: 'Submitted By', value: data.submitterName },
    { label: 'Submitter Email', value: data.submitterEmail, link: 'mailto:' + data.submitterEmail },
    { label: 'Relationship', value: data.relationship || '(not provided)' }
  ];

  const html = buildEmailHtml({
    kind: 'Tribute Submission',
    heading: 'New Tribute',
    intro: 'A tribute was submitted for review on the Tributes page. It will not appear publicly until a chapter officer approves it.',
    fields: fields,
    messageLabel: 'Tribute / Remembrance',
    messageValue: data.tribute,
    badge: 'Needs Review',
    replyEmail: data.submitterEmail,
    replySubject: 'Re: Your tribute submission for ' + data.veteranName
  });

  const text =
    'New tribute submission from www.555ftbraggnc.org\n\n' +
    'Veteran: ' + data.veteranName + '\n' +
    'Rank / Unit: ' + (data.rank || '(not provided)') + '\n' +
    'Year Born: ' + (data.yearBorn || '(not provided)') + '\n' +
    'Year Passed: ' + data.yearPassed + '\n\n' +
    'Tribute:\n' + data.tribute + '\n\n' +
    'Submitted by: ' + data.submitterName + ' (' + data.submitterEmail + ')\n' +
    'Relationship: ' + (data.relationship || '(not provided)') + '\n\n' +
    'This submission needs review before being added to the Tributes page.';

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: data.submitterEmail,
    subject: 'New Tribute Submission, ' + data.veteranName,
    body: text,
    htmlBody: html
  });
}

/**
 * Builds a branded HTML email. Email clients (Gmail, Outlook, Apple Mail)
 * strip <style> blocks and don't load web fonts, so this uses a table
 * layout with inline styles and system serif/sans stacks only. Tested
 * against Gmail's clipping and dark-mode inversion behavior.
 */
function buildEmailHtml(opts) {
  const navy = '#0C1C2B';
  const gold = '#C9A84C';
  const cream = '#F5F0E8';
  const charcoal = '#1A1A1A';
  const dim = '#6b6b6b';
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "'Segoe UI', Helvetica, Arial, sans-serif";

  const fieldRows = opts.fields.map(function (f) {
    const val = f.link
      ? '<a href="' + escapeHtml(f.link) + '" style="color:' + navy + ';text-decoration:none;border-bottom:1px solid rgba(12,28,43,0.2);">' + escapeHtml(f.value) + '</a>'
      : escapeHtml(f.value);
    return (
      '<tr>' +
        '<td style="padding:9px 0;font-family:' + sans + ';font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:' + gold + ';width:130px;vertical-align:top;">' + escapeHtml(f.label) + '</td>' +
        '<td style="padding:9px 0;font-family:' + sans + ';font-size:14px;color:' + charcoal + ';vertical-align:top;">' + val + '</td>' +
      '</tr>'
    );
  }).join('');

  const badge = opts.badge
    ? '<span style="display:inline-block;margin-left:10px;padding:3px 10px;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.4);border-radius:20px;font-family:' + sans + ';font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#8a6416;">' + escapeHtml(opts.badge) + '</span>'
    : '';

  const replyButton = opts.replyEmail
    ? (
      '<tr><td style="padding:24px 36px 4px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:3px;background:' + gold + ';">' +
          '<a href="mailto:' + escapeHtml(opts.replyEmail) + '?subject=' + encodeURIComponent(opts.replySubject || 'Re: Your submission') + '" ' +
          'style="display:inline-block;padding:13px 28px;font-family:' + sans + ';font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:' + navy + ';text-decoration:none;">' +
          'Reply to ' + escapeHtml(opts.replyEmail) +
          '</a>' +
        '</td></tr></table>' +
      '</td></tr>'
    )
    : '';

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
    '<body style="margin:0;padding:0;background:' + cream + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + cream + ';padding:32px 16px;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">' +

          '<tr><td style="background:' + navy + ';padding:28px 36px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
              '<td style="font-family:' + sans + ';font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:' + gold + ';">Samuel Council Chapter &middot; 555th PIA</td>' +
              '<td align="right" style="font-family:' + sans + ';font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);">' + escapeHtml(opts.kind) + '</td>' +
            '</tr></table>' +
          '</td></tr>' +

          '<tr><td style="padding:36px 36px 8px;">' +
            '<div style="font-family:' + serif + ';font-weight:700;font-style:italic;font-size:26px;color:' + navy + ';line-height:1.2;">' + escapeHtml(opts.heading) + badge + '</div>' +
          '</td></tr>' +

          '<tr><td style="padding:0 36px 28px;">' +
            '<div style="font-family:' + sans + ';font-size:13px;color:' + dim + ';line-height:1.7;">' + escapeHtml(opts.intro) + '</div>' +
          '</td></tr>' +

          '<tr><td style="padding:0 36px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(12,28,43,0.08);border-bottom:1px solid rgba(12,28,43,0.08);padding:4px 0;">' +
              fieldRows +
            '</table>' +
          '</td></tr>' +

          '<tr><td style="padding:28px 36px 8px;">' +
            '<div style="font-family:' + sans + ';font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:' + gold + ';margin-bottom:10px;">' + escapeHtml(opts.messageLabel) + '</div>' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + cream + ';border-left:3px solid ' + gold + ';border-radius:2px;">' +
              '<tr><td style="padding:18px 20px;font-family:' + sans + ';font-size:14px;line-height:1.8;color:' + charcoal + ';">' + escapeHtml(opts.messageValue).replace(/\n/g, '<br>') + '</td></tr>' +
            '</table>' +
          '</td></tr>' +

          replyButton +

          '<tr><td style="padding:28px 36px 32px;border-top:1px solid rgba(12,28,43,0.08);margin-top:12px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
              '<td style="font-family:' + sans + ';font-size:11px;letter-spacing:0.05em;color:' + dim + ';">Sent automatically from the form at <a href="' + SITE_URL + '" style="color:' + navy + ';text-decoration:none;">www.555ftbraggnc.org</a></td>' +
            '</tr></table>' +
          '</td></tr>' +

        '</table>' +
      '</td></tr>' +
    '</table>' +
    '</body></html>'
  );
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function appendRow(sheetName, columns, row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(columns);
    sheet.getRange(1, 1, 1, columns.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow(row);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
