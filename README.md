# BasicPay <!-- omit in toc -->

> The app that lets you pay, _basically_, anyone.

An example payments application demonstrating integrations of various Stellar
features and SEPs in a user-facing product.

> :warning: **CAUTION:** Although BasicPay is a full-fledged application on
> Stellar's Testnet, it has been built solely to showcase Stellar functionality
> for the educational purposes of this tutorial, not to be copied, pasted, and
> used on Mainnet.

## Table of Contents <!-- omit in toc -->

- [Companion App](#companion-app)
- [Companion Tutorial](#companion-tutorial)
- [Development Instructions](#development-instructions)
- [Where to Start in this Repository?](#where-to-start-in-this-repository)
  - [Stellar](#stellar)
    - [SEPs](#seps)
    - [Other Stellar Functionality](#other-stellar-functionality)
  - [SvelteKit](#sveltekit)
    - [Pages and Routes](#pages-and-routes)
    - [Stores](#stores)


## Companion App

This isn't just a codebase, it's a fully functioning testnet wallet! You can
check it out and use it here: <https://basicpay.pages.dev>

## Companion Tutorial

This application was built to coincide with a written tutorial, located in the
Stellar documentation. This tutorial is a "nearly comprehensive" guide to
building the features in this app. Following along with the tutorial and this
source code repository, you can get a solid understanding of building an
application on the Stellar network.

Find the start the tutorial here:
<https://developers.stellar.org/docs/building-apps/example-application-tutorial/overview>

## Development Instructions

Clone the repository:

```bash
git clone https://github.com/stellar/basic-payment-app.git
```

Change into the repository app:

```bash
cd basic-payment-app
```

Install dependencies and start the development server.

```bash
yarn install
yarn dev
```

You can now visit the local development site in your browser at
<http://localhost:5173>

## Where to Start in this Repository?

We've worked to document everything in this repo, so start exploring wherever
you like. We'd suggest looking into the following areas:

### Stellar

The heart and soul of this application is interacting with the Stellar network.

#### SEPs

Most of the Stellar interactions take place through the use of SEPs (Stellar
Ecosystem Proposals). These interactions are coded in the
`/src/lib/stellar/sep*.js` files.

#### Other Stellar Functionality

More generic Stellar functionality are located in the same directory:

- `/src/lib/stellar/horizonQueries.js` for querying information from the network
- `/src/lib/stellar/transactions.js` for building different kinds of Stelar
  transactions

### SvelteKit

This application is built using SvelteKit. We don't want to make this much of a
"SvelteKit Tutorial," but here's what you may want to explore:

#### Pages and Routes

We primarily use SvelteKit for its routing capability. You can begin exploring
the SvelteKit components by reading the comments in the
`/src/routes/dashboard/+page.svelte` file.

#### Stores

We also have implemented a few custom stores to keep track of contact names and
addresses, user KYC information, a list of anchor transfers, etc. A good place
to start exploring these stores is the `/src/lib/stores/contactsStore.js` file.
