import { get } from 'svelte/store'
import { contacts } from '$lib/stores/contactsStore'
import { Asset, Keypair, Operation } from 'stellar-sdk'
import { fundWithFriendbot, startTransaction, submit } from '$lib/stellar/horizonQueries'
import { fetchAssets } from '$lib/utils/stellarExpert'

/** @typedef {import('$lib/utils/stellarExpert').RankedAsset} RankedAsset */

/**
 * A filtered user object requested and retrieved from dummyJSON
 * @typedef {Object} DummyJsonUser
 * @property {string} firstName First name of the user
 * @property {number} id ID number of this user
 * @see {@link https://dummyjson.com}
 */

/**
 * Creates a number of new contact entries and adds them to the `contacts` store.
 * @async
 * @function addContacts
 * @param {Object} opts Options object
 * @param {number} opts.numContacts How many contacts should be created
 * @param {boolean} opts.fundContacts Whether or not the contact accounts should be funded by Friendbot
 * @param {boolean} opts.addTrustlines Whether or not the contact accounts should have trustlines created for some non-native assets
 */
export async function addContacts({ numContacts, fundContacts, addTrustlines }) {
    // Fetch some user names from dummyjson.com, just so we don't have to think
    // of any ourselves.
    let usersRes = await fetch(
        `https://dummyjson.com/users?limit=${numContacts}&skip=${
            get(contacts).length
        }&select=firstName`
    )
    let json = await usersRes.json()
    /** @type {DummyJsonUser[]} */
    let users = json.users

    // If the user has selected to add trustlines to the new contacts, query the
    // top-ranked assets from stellar.expert now, so we only have to do it once.
    /** @type {RankedAsset[]} */
    let assets
    if (addTrustlines) {
        assets = await fetchAssets()
    }

    // For each of the contacts, generate a random keypair and add them to our
    // contacts store
    users.map(async (user) => {
        let kp = Keypair.random()
        contacts.add({
            name: user.firstName,
            address: kp.publicKey(),
            favorite: user.id % 2 === 0,
        })

        // If the user has selected to fund the new contact accounts, send a
        // request to friendbot for the account
        if (fundContacts) {
            await fundWithFriendbot(kp.publicKey())
            // If the user has selected to add trustlines to the new contacts,
            // submit that transaction now (only possible after the account has
            // been funded)
            if (addTrustlines) {
                await addContactTrustlines(kp, assets)
            }
        }
    })
}

/**
 * For the Stellar account represented by the provided keypair, submit a transaction to add some helpful asset trustlines.
 * @async
 * @function addContactTrustlines
 * @todo We should combine this into the createContacts function that allows the user to fund the accounts so they don't have to be draining friendbot all the time.
 * @param {Keypair} keypair Stellar keypair representing the contact's account on the Stellar network.
 * @param {RankedAsset[]} assets Array of top assets, as ranked by Stellar.Expert
 */
async function addContactTrustlines(keypair, assets) {
    // Begin a transaction using the typical properties.
    let transaction = await startTransaction(keypair.publicKey())

    // Add the `SRT` asset to get started with testanchor interoperability
    transaction.addOperation(
        Operation.changeTrust({
            asset: new Asset('SRT', 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B'),
        })
    )

    // Add the top 3 assets, as ranked by Stellar.Expert (we skip index 0
    // because that will be XLM, and we can't add a trustline for that anyway)
    for (let { asset } of assets.slice(1, 4)) {
        let assetObj = new Asset(asset.split('-')[0], asset.split('-')[1])
        transaction.addOperation(
            Operation.changeTrust({
                asset: assetObj,
            })
        )
    }

    // Build, sign, and submit the transaction to the network
    let builtTransaction = transaction.setTimeout(30).build()
    builtTransaction.sign(keypair)
    await submit(builtTransaction)
}
