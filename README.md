## Setup

```bash
git clone https://github.com/johnmellor/push-api-nodejs-demo.git
npm install
```

## Run

A `GCM_SENDER_ID` environment variable must be passed to the server, for example:
```bash
export GCM_SENDER_ID=REPLACE_THIS_WITH_YOUR_SENDER_ID
export GCM_API_KEY=REPLACE_THIS_WITH_YOUR_API_KEY
npm start
```

Sender IDs can be obtained [from the Google Developer Console](https://developers.google.com/web/updates/2015/03/push-notificatons-on-the-open-web#make-a-project-on-the-google-developer-console).
