# Wallet checkout options — reviewed 17 November 2026

These are separate from the Pesepay card-only hosted-entry restriction.

| Method | Documented direct flow | Current Opus integration |
| --- | --- | --- |
| InnBucks | Pesepay Make Payment with empty required fields; display QR/short code and await authorisation | Hosted Pesepay; custom QR/code UI is not implemented |
| Omari | Pesepay Make Payment with international wallet phone; collect a six-digit OTP and submit it through the Omari charge endpoint, then independently verify | Hosted Pesepay; custom phone/OTP flow is not implemented |
| OneMoney | Paynow official Node SDK documents sendMobile with onemoney | Hosted Paynow; remote mobile integration is not implemented |
| Telecash / POS2U | No supported direct flow verified in the reviewed public SDK documentation | Hosted Paynow; needs provider confirmation before promising an embedded flow |

Sources:
- https://developers.pesepay.com/payment-methods/innbucks/
- https://developers.pesepay.com/payment-methods/omari/
- https://github.com/paynow/Paynow-NodeJS-SDK (Mobile Transactions)

Pesepay's current documentation says Omari/InnBucks are unavailable in its public
sandbox. A supported API does not prove merchant-specific live acceptance. No
wallet request, OTP submission or live charge was sent during this review.
Do not simply turn off redirect flags: Omari needs the complete OTP exchange,
and InnBucks needs usable authorisation instructions/QR rather than endless polling.
