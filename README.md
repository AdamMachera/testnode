# Webpush demo

A simple [Push API](https://w3c.github.io/push-api/) demo, sending encrypted payloads using the [IETF webpush protocol](https://tools.ietf.org/html/draft-ietf-webpush-protocol-00).

View it at: https://webpush-demo.herokuapp.com/

## Browser support

Chrome has implemented support for the corresponding client-side API, though it currently requires [a few patches and command line flags](https://docs.google.com/document/d/1kDVLMddPJL6iHLJ6QuqNFc1D5X9rASx0PfDd1llxUE4/edit). Other browsers will be listed here once they support webpush.

## Setup

Install node.js 0.12.7 or above, then:
```bash
git clone https://github.com/johnmellor/push-api-nodejs-demo.git
npm install
```

## Run

`GCM_SENDER_ID` and `GCM_API_KEY` environment variables must be passed to the server, for example:
```bash
export GCM_SENDER_ID=653317226796
export GCM_API_KEY=AIzaSyBBh4ddPa96rQQNxqiq_qQj7sq1JdsNQUQ
npm start
```

The API key above is only for debugging, and must not be used in production. Instead you can obtain your own Sender ID and API key [from the Google Developer Console](https://developers.google.com/web/updates/2015/03/push-notificatons-on-the-open-web#make-a-project-on-the-google-developer-console).
