'use strict';

const crypto = require('crypto');
const QRCode = require('qrcode');

const QR_SECRET = process.env.QR_SECRET || 'fallback_secret_change_in_prod';

/**
 * Generate an HMAC-SHA256 signature for a payload.
 */
function signPayload(payload) {
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(payloadStr)
    .digest('hex');
}

/**
 * Create a signed QR payload string for a booking.
 *
 * The payload is: base64(JSON.stringify({ bookingRef, studentId, slotId, ts, sig }))
 */
function createQrPayload(booking) {
  const data = {
    BookingRef: booking.bookingRef,
    Seat: booking.seatLabel || 'N/A',
    StudentId: booking.studentId.toString(),
    SlotId: booking.slotId.toString(),
    Timestamp: Date.now(),
  };

  const Signature = signPayload(JSON.stringify(data));
  const fullPayload = { ...data, Signature };

  // Return formatted JSON string. This makes it human-readable in Google Lens!
  return JSON.stringify(fullPayload, null, 2);
}

/**
 * Parse and verify a QR payload string.
 * Returns the decoded data if valid, throws if invalid.
 */
function verifyQrPayload(qrData) {
  // 1. Check if it's a manual entry of BookingRef (e.g., BKG-1234 or just 1234)
  if (typeof qrData === 'string' && /^(BKG-)?[A-Z0-9]{6,16}$/i.test(qrData.trim())) {
    let ref = qrData.trim().toUpperCase();
    if (!ref.startsWith('BKG-')) {
      ref = `BKG-${ref}`;
    }
    return { bookingRef: ref, isManual: true };
  }

  let decoded;
  let isOldFormat = false;

  try {
    // Attempt to parse the formatted JSON string directly
    decoded = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
  } catch {
    // Fallback: try base64 decode to support old tickets
    try {
      decoded = JSON.parse(Buffer.from(qrData, 'base64').toString('utf8'));
      isOldFormat = true;
    } catch {
      throw new Error('Invalid QR format: unable to decode');
    }
  }

  // Handle old format signature extraction
  if (isOldFormat) {
    const { sig, ...data } = decoded;
    if (!sig) throw new Error('Invalid QR: missing signature');
    
    const expectedSig = signPayload(JSON.stringify(data));
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      throw new Error('Invalid QR: authentication signature mismatch on legacy ticket.');
    }
    
    // Check expiration
    const MAX_AGE_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - data.ts > MAX_AGE_MS) {
      throw new Error('QR code has expired (older than 24 hours)');
    }

    return {
      bookingRef: data.ref,
      studentId: data.sid,
      slotId: data.slot,
      timestamp: data.ts,
    };
  }

  // Handle new format
  const { Signature, ...data } = decoded;
  if (!Signature) {
    throw new Error('Invalid QR: missing security signature');
  }

  const expectedSig = signPayload(JSON.stringify({
    BookingRef: data.BookingRef,
    Seat: data.Seat,
    StudentId: data.StudentId,
    SlotId: data.SlotId,
    Timestamp: data.Timestamp
  }));

  if (!crypto.timingSafeEqual(Buffer.from(Signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
    throw new Error('Invalid QR: authentication signature mismatch. Ticket may be tampered with or duplicated improperly.');
  }

  // Check expiration
  const MAX_AGE_MS = 24 * 60 * 60 * 1000;
  if (Date.now() - data.Timestamp > MAX_AGE_MS) {
    throw new Error('QR code has expired (older than 24 hours)');
  }

  return {
    bookingRef: data.BookingRef,
    studentId: data.StudentId,
    slotId: data.SlotId,
    timestamp: data.Timestamp,
    seatLabel: data.Seat
  };
}

/**
 * Generate a QR code as a base64 data URL string.
 */
async function generateQrCodeImage(payload) {
  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    throw new Error(`QR code generation failed: ${err.message}`);
  }
}

module.exports = {
  createQrPayload,
  verifyQrPayload,
  generateQrCodeImage,
  signPayload,
};
