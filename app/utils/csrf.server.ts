import { createCookie } from '@remix-run/node';
import { CSRF, CSRFError } from 'remix-utils/csrf/server';

const cookie = createCookie('csrf', {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  secrets: process.env.SESSION_SECRET.split(','),
});

export const csrf = new CSRF({ cookie });

export const validateCsrfToken = async (
  formData: FormData,
  requestHeaders: Headers,
) => {
  try {
    await csrf.validate(formData, requestHeaders);
  } catch (error) {
    if (error instanceof CSRFError)
      throw new Response(error.message, { status: 403 });

    throw error;
  }
};
