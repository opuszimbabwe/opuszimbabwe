# Pesepay card entry — documentation review, 17 November 2026

The current public documentation explicitly requires the hosted redirect flow
for Visa, Mastercard and ZimSwitch. Visa/Mastercard have no seamless integration
today; card details and any required bank authentication are entered on Pesepay.
ZimSwitch likewise exposes no fields for Make Payment.

Sources checked:
- https://developers.pesepay.com/payment-methods/card-payments/
- https://developers.pesepay.com/payment-methods/zimswitch/
- https://developers.pesepay.com/payments/seamless-flow/
- https://developers.pesepay.com/api/initiate-transaction/

Initiate Transaction supports paymentMethodCode to preselect the hosted method.
The Opus create handler already supplies the server-resolved method code and
redirects to the provider URL. It does not accept or submit PAN, expiry or CVV.
The documented initiate request has no fields for prepopulating card details.

The hosted page belongs to Pesepay: Opus CSS cannot change its layout or fill its
inputs across origins. An embedded branded card-entry experience would require
a provider-approved hosted-fields/tokenization integration; no such card flow
is offered by the reviewed public documentation. Handling raw card details on
Opus would introduce PCI DSS obligations and is not an equivalent substitute.

No live payment was created or submitted during this review. A hosted URL alone
does not establish why its particular session did not display card-entry fields.
