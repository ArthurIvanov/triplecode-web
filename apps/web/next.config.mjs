export default {
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Referrer-Policy', value: 'same-origin' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Content-Security-Policy', value: "base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'" },
      ],
    }];
  },
};
