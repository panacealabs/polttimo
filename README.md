# polttimo

Circle CI build breaks -> Ikea Trådfri lightbulb turns red.

## Running the app

1. [Download a release](...).
1. Create a CircleCI token if you don't already have one
1. Find the secret on the bottom of the Ikea hub
1. Decide which CircleCI project and workflows to watch. If any of these workflows fail under the `master` branch, the light turns red
1. Start the app:

```bash
CIRCLE_TOKEN="secret" \
CIRCLE_PROJECT="Name of your CircleCI project (usually the reponame)" \
CIRCLE_WORKFLOWS="comma,separated,list" \
IKEA_SECRET="See bottom of the hub" \
LIGHTBULB_NAME="Name of your Ikea lightbulb" \
./polttimo
```

## Local Development

```bash
yarn start
```

## Create self-contained OS X binary for distribution

```bash
npm install -g pkg
yarn build

# Creates ./polttimo
```
