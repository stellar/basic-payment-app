import { get } from 'svelte/store'
import { contacts } from '$lib/stores/contactsStore'
import { Asset, Keypair, Operation } from 'stellar-sdk'
import { fundWithFriendbot, startTransaction, submit } from '$lib/stellar/horizonQueries'
import { fetchAssets } from '$lib/utils/stellarExpert'

/**
 * Creates a number of new contact entries and adds them to the `contacts` store.
 * @param {Object} opts - Options object
 * @param {number} opts.numContacts - How many contacts should be created
 * @param {boolean} opts.fundContacts - Whether or not the contact accounts should be funded by Friendbot
 * @param {boolean} opts.addTrustlines - Whether or not the contact accounts should have trustlines created for some non-native assets
 */
export async function addContacts({numContacts, fundContacts, addTrustlines}) {
    // console.log("I am being called `addContacts`")
    const usersRes = await fetch(`https://dummyjson.com/users?limit=${numContacts}&skip=${get(contacts).length}&select=firstName`)
    const { users } = await usersRes.json()

    let assets = [{}]
    if (addTrustlines) {
        assets = await fetchAssets()
    }

    users.map(async (user) => {
        let kp = Keypair.random()
        contacts.add({
            name: user.firstName,
            address: kp.publicKey(),
            favorite: user.id % 2 === 0,
        })

        if (fundContacts) {
            await fundWithFriendbot(kp.publicKey())
            if (addTrustlines) {
                await addContactTrustlines(kp, assets)
            }
        }


    })
}

async function addContactTrustlines(keypair, assets) {
    let transaction = await startTransaction(keypair.publicKey())
    transaction.addOperation(
        Operation.changeTrust({
            asset: new Asset('SRT', 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B'),
        })
    )

    for (let { asset } of assets.slice(1, 4)) {
        let assetObj = new Asset(asset.split('-')[0], asset.split('-')[1])
        transaction.addOperation(
            Operation.changeTrust({
                asset: assetObj,
            })
        )
    }

    console.log('transaction', transaction)
    transaction = transaction.setTimeout(30).build()
    console.log('transaction', transaction)
    transaction.sign(keypair)

    await submit(transaction)
}
